/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, mixin, Type } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  FindOptionsWhere,
  In,
  InsertResult,
  ObjectId,
  Repository,
  SaveOptions,
  UpdateResult
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';
import { BasicAggregateRoot } from '../aggregate/aggregate-root';
import { IdEntity } from '../entity/id.entity';
import { putBackIdForUpdate, removeIdForUpdate } from '../entity/entity.util';
import { AppRepository } from './app.repository';
import { MarshallerMixin } from './marshaller.mixin';
import { contextualize, contextualizeArray } from './contextualize.util';
import { escapeLikeToRegex, isMongoDriver as checkIsMongoDriver } from './db.util';

type FindOperatorType = 'not' | 'lessThan' | 'lessThanOrEqual' | 'moreThan' | 'moreThanOrEqual' |
  'equal' | 'between' | 'in' | 'any' | 'isNull' | 'like' | 'ilike' | 'regex' |
  'arrayContains' | 'arrayContainedBy' | 'arrayOverlap' | 'raw' | 'or' | 'and';

export const RepositoryMixin = <AppEntity extends IdEntity, AppModel extends BasicAggregateRoot>(
  tEntity: Type<AppEntity>,
  tModel: Type<AppModel>,
) => {
  type PrimitiveCriteria = string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[];

  @Injectable()
  class CustomRepository implements AppRepository<AppEntity, AppModel> {
    #marshallerService = new (MarshallerMixin(tEntity, tModel))();

    constructor(
      @InjectRepository(tEntity) public repository: Repository<AppEntity>,
    ) { }

    #isPrimitiveType(value: any | any[]): boolean {
      if (Array.isArray(value)) {
        return value.every(v => (typeof v === 'string') || (v instanceof Date) || (v && typeof v === 'object' && typeof v.toHexString === 'function'));
      }
      return (typeof value === 'string') || (value instanceof Date) || (value && typeof value === 'object' && typeof value.toHexString === 'function');
    }

    #contextualize<T, V>(docOrDocs: T | T[], access: 'read' | 'write' = 'read'): V {
      if (Array.isArray(docOrDocs)) {
        return contextualizeArray(tEntity, docOrDocs, access) as unknown as V;
      }
      return contextualize(tEntity, docOrDocs, access) as unknown as V;
    }

    #toDomain(entity: AppEntity): AppModel {
      return this.#marshallerService.toDomain(entity);
    }

    #fromDomain(model: AppModel): AppEntity {
      return this.#marshallerService.fromDomain(model);
    }

    #isMongoDriver(): boolean {
      return checkIsMongoDriver(this.repository);
    }

    #isFindOperator(value: unknown): value is FindOperator<unknown> {
      const maybe = value as { ['@instanceof']?: unknown; _type?: unknown } | null | undefined;
      return !!maybe && typeof maybe === 'object' && ('@instanceof' in maybe) && (typeof maybe['@instanceof'] === 'symbol') && ('_type' in maybe);
    }

    #translateOperatorToMongo(value: unknown): unknown {
      if (!this.#isFindOperator(value)) return value;
      const type = (value as unknown as { _type: string })._type as FindOperatorType;
      const inner = (value as unknown as { _value: unknown })._value;
      switch (type) {
        case 'not': {
          if (this.#isFindOperator(inner)) {
            const t = (inner as any)._type as FindOperatorType;
            const v = (inner as any)._value;
            if (t === 'in') return { $nin: v };
            if (t === 'isNull') return { $ne: null };
            if (t === 'like') return { $not: new RegExp(v as string) };
            return { $not: this.#translateOperatorToMongo(inner) };
          }
          return { $ne: inner };
        }
        case 'regex':
          if (inner instanceof RegExp) return inner;
          if (typeof inner === 'string') return { $regex: inner };
          if (typeof inner === 'object') {
            const { pattern, options } = inner as any;
            return { $regex: pattern, $options: options ?? '' };
          }
          return inner;
        case 'moreThan': return { $gt: inner as unknown };
        case 'lessThan': return { $lt: inner as unknown };
        case 'moreThanOrEqual': return { $gte: inner as unknown };
        case 'lessThanOrEqual': return { $lte: inner as unknown };
        case 'equal': return { $eq: inner as unknown };
        case 'in': return { $in: inner as unknown };
        case 'between': {
          const arr = inner as unknown as [unknown, unknown];
          return { $gte: arr[0], $lte: arr[1] };
        }
        case 'like': return { $regex: escapeLikeToRegex(inner as string), $options: '' };
        case 'ilike': return { $regex: escapeLikeToRegex(inner as string), $options: 'i' };
        case 'isNull': return { $eq: null };
        case 'any': return { $in: inner as unknown };
        case 'arrayContains': return { $all: inner as unknown };
        case 'arrayContainedBy': return { $not: { $elemMatch: { $nin: inner as unknown[] } } };
        case 'arrayOverlap': return { $in: inner as unknown[] };
        case 'raw': return inner as unknown;
        default: return inner as unknown;
      }
    }

    #mongoIdKey(key: string): string {
      return key === 'id' ? '_id' : key;
    }

    #translateWhereObjectToMongo(where: Record<string, unknown>): Record<string, unknown> {
      const translated: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(where)) {
        if (this.#isFindOperator(val)) {
          const type = (val as unknown as { _type: string })._type;
          if (type === 'or' || type === 'and') {
            const inner = (val as unknown as { _value: unknown[] })._value;
            const clauses = inner.map(op => ({ [this.#mongoIdKey(key)]: this.#translateOperatorToMongo(op) }));
            if (type === 'or') {
              const existing = translated['$or'] as unknown[] | undefined;
              if (Array.isArray(existing)) { existing.push(...clauses); }
              else { translated['$or'] = clauses; }
            } else {
              for (const clause of clauses) { Object.assign(translated, clause); }
            }
          } else {
            translated[this.#mongoIdKey(key)] = this.#translateOperatorToMongo(val);
          }
        } else if (val && typeof val === 'object' && typeof (val as any).toHexString === 'function') {
          translated[this.#mongoIdKey(key)] = val;
        } else if (val instanceof Date || val instanceof RegExp) {
          translated[this.#mongoIdKey(key)] = val;
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
          translated[this.#mongoIdKey(key)] = this.#translateWhereObjectToMongo(val as Record<string, unknown>);
        } else {
          translated[this.#mongoIdKey(key)] = val;
        }
      }
      return translated;
    }

    #buildMongoFilter(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[] | undefined): FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[] | undefined {
      if (!where) return undefined;
      if (Array.isArray(where)) {
        const translatedConditions = where.map(w => this.#translateWhereObjectToMongo(w));
        return this.#contextualize({ $and: [{ $or: translatedConditions }] }) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[];
      }
      return this.#contextualize(this.#translateWhereObjectToMongo(where)) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[];
    }

    #buildOptions(options?: FindManyOptions<AppEntity> | FindOneOptions<AppEntity>): FindManyOptions<AppEntity> | FindOneOptions<AppEntity> | undefined {
      return { ...options, ...this.#isMongoDriver() ? { where: this.#buildMongoFilter(options?.where) } : {} };
    }

    #buildOptionsWhere(where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[] | undefined {
      return this.#isMongoDriver() ? this.#buildMongoFilter(where) : where;
    }

    readonly entityName = tEntity.name;
    readonly target = this.repository.target;
    readonly manager = this.repository.manager;
    readonly queryRunner = this.repository.queryRunner;
    get metadata() { return this.repository.metadata; }
    createQueryBuilder = this.repository.createQueryBuilder;
    hasId = this.repository.hasId;
    getId = this.repository.getId;

    create(): AppModel;
    create(entityLike: DeepPartial<AppModel>): AppModel;
    create(entityLikeArray: DeepPartial<AppModel>[]): AppModel[];
    create(entityOrEntities?: DeepPartial<AppModel> | (DeepPartial<AppModel>[])): AppModel | AppModel[] {
      const isArray = Array.isArray(entityOrEntities);
      const wrapper = entityOrEntities
        ? this.repository.create(
          this.#contextualize(isArray
            ? entityOrEntities.map(e => this.#fromDomain(e as AppModel))
            : [this.#fromDomain(entityOrEntities as AppModel)],
            'write'
          ) as DeepPartial<AppEntity>[],
        )
        : this.repository.create();
      return isArray
        ? (wrapper as AppEntity[]).map(w => this.#toDomain(w))
        : entityOrEntities
          ? this.#toDomain((wrapper as AppEntity[])[0])
          : this.#toDomain(wrapper as AppEntity);
    }

    merge(mergeIntoEntity: AppEntity, ...entityLikes: DeepPartial<AppEntity>[]): AppModel {
      return this.#toDomain(
        this.repository.merge(
          this.#contextualize(mergeIntoEntity, 'write'),
          ...this.#contextualize<DeepPartial<AppEntity>, DeepPartial<AppEntity>[]>(entityLikes, 'write')
        )
      );
    }

    async preload(entityLike: DeepPartial<AppEntity>): Promise<AppModel | undefined> {
      const response = await this.repository.preload(this.#contextualize(entityLike));
      return response ? this.#toDomain(response) : undefined;
    }

    save<T extends DeepPartial<AppModel>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]>;
    save<T extends DeepPartial<AppModel>>(entities: T[], options?: SaveOptions): Promise<(T & AppModel)[]>;
    save<T extends DeepPartial<AppModel>>(entity: T, options: SaveOptions & { reload: false }): Promise<T>;
    save<T extends DeepPartial<AppModel>>(entity: T, options?: SaveOptions): Promise<T & AppModel>;
    async save<T extends DeepPartial<AppModel>>(
      entityOrEntities: DeepPartial<T> | (DeepPartial<T>[]),
      options?: SaveOptions | SaveOptions & { reload: false }
    ): Promise<T[] | (T & AppModel)[] | T | T & AppModel> {
      const isArray = Array.isArray(entityOrEntities);
      const query = this.#contextualize(isArray
        ? entityOrEntities.map(e => (this.#fromDomain(e as AppModel)))
        : [this.#fromDomain(entityOrEntities as AppModel)],
        'write'
      ) as DeepPartial<AppEntity>[];
      const wrapper = await this.repository.save(query, options);
      const response = wrapper.map(w => this.#toDomain(w));
      return isArray ? response as T[] : response[0] as T;
    }

    remove = this.repository.remove;
    softRemove = this.repository.softRemove;
    recover = this.repository.recover;

    async insert(entity: QueryDeepPartialEntity<AppEntity> | QueryDeepPartialEntity<AppEntity>[]): Promise<InsertResult> {
      return this.repository.insert(this.#contextualize(entity, 'write'));
    }

    async update(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult> {
      const isMongo = this.#isMongoDriver();
      const query: PrimitiveCriteria | FindOptionsWhere<AppEntity> = this.#isPrimitiveType(criteria)
        ? criteria
        : (isMongo
          ? (putBackIdForUpdate(this.#buildMongoFilter(criteria as FindOptionsWhere<AppEntity>)) as unknown as FindOptionsWhere<AppEntity>)
          : this.#contextualize(criteria as FindOptionsWhere<AppEntity>, 'read'));
      return this.repository.update(query, removeIdForUpdate(this.#contextualize(this.#fromDomain(partialEntity as AppModel), 'write')));
    }

    async upsert(entityOrEntities: Partial<AppModel> | Partial<AppModel>[], conflictPathsOrOptions: string[] | UpsertOptions<AppEntity>): Promise<InsertResult> {
      const isArray = Array.isArray(entityOrEntities);
      return await this.repository.upsert(
        this.#contextualize(isArray
          ? entityOrEntities.map(e => (this.#fromDomain(e as AppModel)))
          : [this.#fromDomain(entityOrEntities as AppModel)],
          'write'
        ) as QueryDeepPartialEntity<AppEntity>[],
        conflictPathsOrOptions
      );
    }

    delete(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>): Promise<DeleteResult> {
      const isMongo = this.#isMongoDriver();
      if (this.#isPrimitiveType(criteria)) return this.repository.delete(criteria);
      const effective: PrimitiveCriteria | FindOptionsWhere<AppEntity> = isMongo
        ? (this.#buildOptionsWhere(criteria as FindOptionsWhere<AppEntity>) as unknown as FindOptionsWhere<AppEntity>)
        : this.#contextualize(criteria as FindOptionsWhere<AppEntity>);
      return this.repository.delete(putBackIdForUpdate(effective));
    }

    softDelete(criteria: PrimitiveCriteria | ObjectId | ObjectId[] | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult> {
      const isMongo = this.#isMongoDriver();
      if (this.#isPrimitiveType(criteria)) {
        if (isMongo) {
          return this.repository.update(criteria, removeIdForUpdate(this.#contextualize(this.#fromDomain(partialEntity as AppModel), 'write')));
        } else {
          return this.repository.softDelete(criteria);
        }
      }
      const effective = isMongo
        ? (this.#buildOptionsWhere(criteria as FindOptionsWhere<AppEntity>) as unknown as FindOptionsWhere<AppEntity>)
        : this.#contextualize(criteria as FindOptionsWhere<AppEntity>) as FindOptionsWhere<AppEntity>;
      if (isMongo) {
        return this.repository.update(putBackIdForUpdate(effective), removeIdForUpdate(this.#contextualize(this.#fromDomain(partialEntity as AppModel), 'write')));
      } else {
        return this.repository.softDelete(effective);
      }
    }

    restore(criteria: PrimitiveCriteria | ObjectId | ObjectId[] | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult> {
      const checkpoint = { deletedAt: null, deletedBy: null };
      const isMongo = this.#isMongoDriver();
      if (this.#isPrimitiveType(criteria)) {
        if (isMongo) {
          return this.repository.update(criteria, removeIdForUpdate(this.#contextualize({ ...this.#fromDomain(partialEntity as AppModel), ...checkpoint }, 'write')));
        } else {
          return this.repository.restore(criteria);
        }
      }
      const effective = isMongo
        ? (this.#buildOptionsWhere(criteria as FindOptionsWhere<AppEntity>) as unknown as FindOptionsWhere<AppEntity>)
        : this.#contextualize(criteria as FindOptionsWhere<AppEntity>) as FindOptionsWhere<AppEntity>;
      if (isMongo) {
        return this.repository.update(putBackIdForUpdate(effective), removeIdForUpdate(this.#contextualize({ ...this.#fromDomain(partialEntity as AppModel), ...checkpoint }, 'write')));
      } else {
        return this.repository.restore(effective);
      }
    }

    exist = this.repository.exist;

    async exists(options?: FindManyOptions<AppEntity>): Promise<boolean> {
      if (this.#isMongoDriver()) {
        const query = this.#buildOptions(options) as FindManyOptions<AppEntity>;
        return this.repository.count(query).then((c) => c > 0);
      }
      const query = { ...options, where: this.#contextualize(options?.where ?? {}) } as FindManyOptions<AppEntity>;
      return this.repository.exists(query);
    }

    async existsBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<boolean> {
      if (this.#isMongoDriver()) {
        const query = this.#buildOptions({ where }) as FindManyOptions<AppEntity>;
        const count = await this.repository.count(query);
        return count > 0;
      }
      const query = this.#contextualize(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[];
      return this.repository.existsBy(query);
    }

    async count(options?: FindManyOptions<AppEntity>): Promise<number> {
      if (this.#isMongoDriver()) {
        return this.repository.count(this.#buildOptions(options) as FindManyOptions<AppEntity>);
      }
      return this.repository.count({ ...options, where: this.#contextualize(options?.where ?? {}) } as FindManyOptions<AppEntity>);
    }

    async countBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number> {
      if (this.#isMongoDriver()) {
        return this.repository.count(this.#buildOptions({ where }) as FindManyOptions<AppEntity>);
      }
      return this.repository.countBy(this.#contextualize(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
    }

    async sum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null> {
      const effectiveWhere = this.#isMongoDriver() ? (this.#buildMongoFilter(where) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]) : this.#contextualize(where);
      return this.repository.sum(columnName, effectiveWhere as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
    }

    async average(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null> {
      const effectiveWhere = this.#isMongoDriver() ? (this.#buildMongoFilter(where) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]) : this.#contextualize(where);
      return this.repository.average(columnName, effectiveWhere as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
    }

    async minimum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null> {
      const effectiveWhere = this.#isMongoDriver() ? (this.#buildMongoFilter(where) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]) : this.#contextualize(where);
      return this.repository.minimum(columnName, effectiveWhere as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
    }

    async maximum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null> {
      const effectiveWhere = this.#isMongoDriver() ? (this.#buildMongoFilter(where) as unknown as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]) : this.#contextualize(where);
      return this.repository.maximum(columnName, effectiveWhere as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
    }

    async find(options?: FindManyOptions<AppEntity>): Promise<AppModel[]> {
      let response: AppEntity[];
      if (this.#isMongoDriver()) {
        response = await this.repository.find(this.#buildOptions(options) as FindManyOptions<AppEntity>);
      } else {
        response = await this.repository.find({ ...options, where: this.#contextualize(options?.where ?? {}) } as FindManyOptions<AppEntity>);
      }
      return response.map(r => this.#toDomain(r));
    }

    async findBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[], optionsWithoutWhere?: Omit<FindManyOptions<AppEntity>, 'where'>): Promise<AppModel[]> {
      let response: AppEntity[];
      if (this.#isMongoDriver()) {
        const query = this.#buildOptionsWhere(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[];
        response = await this.repository.find({ ...optionsWithoutWhere, where: query });
      } else {
        response = await this.repository.findBy(this.#contextualize(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
      }
      return response.map(r => this.#toDomain(r));
    }

    async findAndCount(options?: FindManyOptions<AppEntity>): Promise<{ data: AppModel[], total: number }> {
      let response: AppEntity[]; let total: number;
      if (this.#isMongoDriver()) {
        [response, total] = await this.repository.findAndCount(this.#buildOptions(options) as FindManyOptions<AppEntity>);
      } else {
        [response, total] = await this.repository.findAndCount({ ...options, where: this.#contextualize(options?.where ?? {}) } as FindManyOptions<AppEntity>);
      }
      return { data: response.map(r => this.#toDomain(r)), total };
    }

    async findAndCountBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<{ data: AppModel[], total: number }> {
      let response: AppEntity[]; let total: number;
      if (this.#isMongoDriver()) {
        [response, total] = await this.repository.findAndCount(this.#buildOptions({ where }) as FindManyOptions<AppEntity>);
      } else {
        [response, total] = await this.repository.findAndCountBy(this.#contextualize(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
      }
      return { data: response.map(r => this.#toDomain(r)), total };
    }

    async findByIds(ids: any[]): Promise<AppModel[]> {
      const where = { id: In(ids) } as FindOptionsWhere<AppEntity>;
      return this.findBy(where);
    }

    async findOne(options: FindOneOptions<AppEntity>): Promise<AppModel | null> {
      let response: AppEntity | null;
      if (this.#isMongoDriver()) {
        response = await this.repository.findOne(this.#buildOptions(options) as FindOneOptions<AppEntity>);
      } else {
        response = await this.repository.findOne({ ...options, where: this.#contextualize(options?.where ?? {}) } as FindOneOptions<AppEntity>);
      }
      return response ? this.#toDomain(response) : null;
    }

    async findOneBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<AppModel | null> {
      let response: AppEntity | null;
      if (this.#isMongoDriver()) {
        response = await this.repository.findOne(this.#buildOptions({ where }) as FindOneOptions<AppEntity>);
      } else {
        response = await this.repository.findOneBy(this.#contextualize(where) as FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]);
      }
      return response ? this.#toDomain(response) : null;
    }

    async findOneById(id: number | string | Date | ObjectId): Promise<AppModel | null> {
      const where = { id } as FindOptionsWhere<AppEntity>;
      return this.findOneBy(where);
    }

    async findOneOrFail(options: FindOneOptions<AppEntity>): Promise<AppModel> {
      let response: AppEntity;
      if (this.#isMongoDriver()) {
        response = await this.repository.findOneOrFail(this.#buildOptions(options) as FindOneOptions<AppEntity>);
      } else {
        response = await this.repository.findOneOrFail({ ...options, where: this.#contextualize(options?.where ?? {}) });
      }
      return this.#toDomain(response);
    }

    async findOneByOrFail(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<AppModel> {
      let response: AppEntity;
      if (this.#isMongoDriver()) {
        response = await this.repository.findOneOrFail(this.#buildOptions({ where }) as FindOneOptions<AppEntity>);
      } else {
        response = await this.repository.findOneByOrFail(this.#contextualize(where));
      }
      return this.#toDomain(response);
    }

    query = this.repository.query;
    clear = this.repository.clear;
    increment = this.repository.increment;
    decrement = this.repository.decrement;

    extend<CustomRepo>(customs: CustomRepo & ThisType<this & CustomRepo>): this & CustomRepo {
      return this.repository.extend(customs) as unknown as this & CustomRepo;
    }
  }
  return mixin(CustomRepository);
};
