/* eslint-disable @typescript-eslint/no-explicit-any */
import { AggregateRoot } from '@nestjs/cqrs';
import {
  DeepPartial,
  DeleteResult,
  EntityManager,
  EntityMetadata,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  QueryRunner,
  RemoveOptions,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';
import { IdEntity } from '../entity/id.entity';

type PrimitiveCriteria = string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[];

export abstract class AppRepository<AppEntity extends IdEntity, AppModel extends AggregateRoot> {
  readonly entityName?: string;
  readonly target!: EntityTarget<AppEntity>;
  readonly manager!: EntityManager;
  readonly queryRunner?: QueryRunner;
  abstract get metadata(): EntityMetadata;
  abstract createQueryBuilder(alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<AppEntity>;
  abstract hasId(entity: AppEntity): boolean;
  abstract getId(entity: AppEntity): any;
  abstract create(): AppModel;
  abstract create(entityLikeArray: DeepPartial<AppModel>[]): AppModel[];
  abstract create(entityLike: DeepPartial<AppModel>): AppModel;
  abstract merge(mergeIntoEntity: AppEntity, ...entityLikes: DeepPartial<AppEntity>[]): AppModel;
  abstract preload(entityLike: DeepPartial<AppEntity>): Promise<AppModel | undefined>;
  abstract save<T extends DeepPartial<AppModel>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]>;
  abstract save<T extends DeepPartial<AppModel>>(entities: T[], options?: SaveOptions): Promise<(T & AppModel)[]>;
  abstract save<T extends DeepPartial<AppModel>>(entity: T, options: SaveOptions & { reload: false }): Promise<T>;
  abstract save<T extends DeepPartial<AppModel>>(entity: T, options?: SaveOptions): Promise<T & AppModel>;
  abstract remove(entities: AppEntity[], options?: RemoveOptions): Promise<AppEntity[]>;
  abstract remove(entity: AppEntity, options?: RemoveOptions): Promise<AppEntity>;
  abstract softRemove<T extends DeepPartial<AppEntity>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]>;
  abstract softRemove<T extends DeepPartial<AppEntity>>(entities: T[], options?: SaveOptions): Promise<(T & AppEntity)[]>;
  abstract softRemove<T extends DeepPartial<AppEntity>>(entity: T, options: SaveOptions & { reload: false }): Promise<T>;
  abstract softRemove<T extends DeepPartial<AppEntity>>(entity: T, options?: SaveOptions): Promise<T & AppEntity>;
  abstract recover<T extends DeepPartial<AppEntity>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]>;
  abstract recover<T extends DeepPartial<AppEntity>>(entities: T[], options?: SaveOptions): Promise<(T & AppEntity)[]>;
  abstract recover<T extends DeepPartial<AppEntity>>(entity: T, options: SaveOptions & { reload: false }): Promise<T>;
  abstract recover<T extends DeepPartial<AppEntity>>(entity: T, options?: SaveOptions): Promise<T & AppEntity>;
  abstract insert(entity: QueryDeepPartialEntity<AppEntity> | QueryDeepPartialEntity<AppEntity>[]): Promise<InsertResult>;
  abstract update(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract upsert(entityOrEntities: Partial<AppModel> | Partial<AppModel>[], conflictPathsOrOptions: string[] | UpsertOptions<AppEntity>): Promise<InsertResult>;
  abstract delete(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>): Promise<DeleteResult>;
  abstract softDelete(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract restore(criteria: PrimitiveCriteria | FindOptionsWhere<AppEntity>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract exist(options?: FindManyOptions<AppEntity>): Promise<boolean>;
  abstract exists(options?: FindManyOptions<AppEntity>): Promise<boolean>;
  abstract existsBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<boolean>;
  abstract count(options?: FindManyOptions<AppEntity>): Promise<number>;
  abstract countBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number>;
  abstract sum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null>;
  abstract average(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null>;
  abstract minimum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null>;
  abstract maximum(columnName: PickKeysByType<AppEntity, number>, where?: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<number | null>;
  abstract find(options?: FindManyOptions<AppEntity>): Promise<AppModel[]>;
  abstract findBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[], optionsWithoutWhere?: Omit<FindManyOptions<AppEntity>, 'where'>): Promise<AppModel[]>;
  abstract findAndCount(options?: FindManyOptions<AppEntity>): Promise<{ data: AppModel[], total: number }>;
  abstract findAndCountBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<{ data: AppModel[], total: number }>;
  abstract findByIds(ids: any[]): Promise<AppModel[]>;
  abstract findOne(options: FindOneOptions<AppEntity>): Promise<AppModel | null>;
  abstract findOneBy(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<AppModel | null>;
  abstract findOneById(id: number | string | Date | ObjectId): Promise<AppModel | null>;
  abstract findOneOrFail(options: FindOneOptions<AppEntity>): Promise<AppModel>;
  abstract findOneByOrFail(where: FindOptionsWhere<AppEntity> | FindOptionsWhere<AppEntity>[]): Promise<AppModel>;
  abstract query(query: string, parameters?: any[]): Promise<any>;
  abstract clear(): Promise<void>;
  abstract increment(conditions: FindOptionsWhere<AppEntity>, propertyPath: string, value: number | string): Promise<UpdateResult>;
  abstract decrement(conditions: FindOptionsWhere<AppEntity>, propertyPath: string, value: number | string): Promise<UpdateResult>;
  abstract extend<CustomRepository>(customs: CustomRepository & ThisType<this & CustomRepository>): this & CustomRepository;
}
