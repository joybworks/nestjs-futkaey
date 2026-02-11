/* eslint-disable @typescript-eslint/no-explicit-any */
import { AggregateRoot } from '@nestjs/cqrs';
import {
  DeepPartial, DeleteResult, EntityManager, EntityMetadata, EntityTarget,
  FindManyOptions, FindOneOptions, FindOptionsWhere, InsertResult, ObjectId,
  QueryRunner, RemoveOptions, SaveOptions, SelectQueryBuilder, UpdateResult
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';
import { AppRepository } from '../repository/app.repository';
import { IdEntity } from '../entity/id.entity';

type RequireIdField<T, IdField extends keyof T> = T & Required<Pick<T, IdField>>;

export abstract class DynamicRepository<
  AppEntity extends IdEntity,
  AppModel extends AggregateRoot,
  IdField extends keyof AppEntity
> implements Omit<AppRepository<AppEntity, AppModel>,
  'find' | 'findBy' | 'findOne' | 'findOneBy' | 'findOneByOrFail' |
  'findAndCount' | 'findAndCountBy' | 'count' | 'countBy' |
  'exists' | 'existsBy' | 'update' | 'delete' | 'softDelete' | 'restore' |
  'sum' | 'average' | 'minimum' | 'maximum' | 'increment' | 'decrement'
> {
  readonly entityName?: string;
  readonly target!: EntityTarget<AppEntity>;
  readonly manager!: EntityManager;
  readonly queryRunner?: QueryRunner;
  abstract get metadata(): EntityMetadata;
  abstract createQueryBuilder(alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<AppEntity>;
  abstract hasId(entity: AppEntity): boolean;
  abstract getId(entity: AppEntity): any;
  abstract init(id: any): Promise<void>;
  abstract destroy(id: any): Promise<void>;
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
  abstract upsert(entityOrEntities: Partial<AppModel> | Partial<AppModel>[], conflictPathsOrOptions: string[] | UpsertOptions<AppEntity>): Promise<InsertResult>;
  abstract exist(options?: FindManyOptions<RequireIdField<AppEntity, IdField>>): Promise<boolean>;
  abstract findByIds(ids: any[]): Promise<AppModel[]>;
  abstract findOneById(id: number | string | Date | ObjectId): Promise<AppModel | null>;
  abstract findOneOrFail(options: FindOneOptions<RequireIdField<AppEntity, IdField>>): Promise<AppModel>;
  abstract query(query: string, parameters?: any[]): Promise<any>;
  abstract clear(): Promise<void>;
  abstract extend<CustomRepository>(customs: CustomRepository & ThisType<this & CustomRepository>): this & CustomRepository;

  abstract find(options?: FindManyOptions<RequireIdField<AppEntity, IdField>>): Promise<AppModel[]>;
  abstract findBy(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[], optionsWithoutWhere?: Omit<FindManyOptions<AppEntity>, 'where'>): Promise<AppModel[]>;
  abstract findAndCount(options?: FindManyOptions<RequireIdField<AppEntity, IdField>>): Promise<{ data: AppModel[], total: number }>;
  abstract findAndCountBy(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<{ data: AppModel[], total: number }>;
  abstract findOne(options: FindOneOptions<RequireIdField<AppEntity, IdField>>): Promise<AppModel | null>;
  abstract findOneBy(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<AppModel | null>;
  abstract findOneByOrFail(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<AppModel>;
  abstract count(options?: FindManyOptions<RequireIdField<AppEntity, IdField>>): Promise<number>;
  abstract countBy(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<number>;
  abstract exists(options?: FindManyOptions<RequireIdField<AppEntity, IdField>>): Promise<boolean>;
  abstract existsBy(where: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<boolean>;
  abstract sum(columnName: PickKeysByType<AppEntity, number>, where?: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<number | null>;
  abstract average(columnName: PickKeysByType<AppEntity, number>, where?: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<number | null>;
  abstract minimum(columnName: PickKeysByType<AppEntity, number>, where?: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<number | null>;
  abstract maximum(columnName: PickKeysByType<AppEntity, number>, where?: RequireIdField<FindOptionsWhere<AppEntity>, IdField> | RequireIdField<FindOptionsWhere<AppEntity>, IdField>[]): Promise<number | null>;
  abstract update(criteria: RequireIdField<FindOptionsWhere<AppEntity>, IdField>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract delete(criteria: RequireIdField<FindOptionsWhere<AppEntity>, IdField>): Promise<DeleteResult>;
  abstract softDelete(criteria: RequireIdField<FindOptionsWhere<AppEntity>, IdField>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract restore(criteria: RequireIdField<FindOptionsWhere<AppEntity>, IdField>, partialEntity: Partial<AppModel>): Promise<UpdateResult>;
  abstract increment(conditions: RequireIdField<FindOptionsWhere<AppEntity>, IdField>, propertyPath: string, value: number | string): Promise<UpdateResult>;
  abstract decrement(conditions: RequireIdField<FindOptionsWhere<AppEntity>, IdField>, propertyPath: string, value: number | string): Promise<UpdateResult>;
}
