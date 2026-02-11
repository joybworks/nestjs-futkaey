/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, mixin, Type } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BasicAggregateRoot } from '../aggregate/aggregate-root';
import { IdEntity } from '../entity/id.entity';
import { AppRepository } from '../repository/app.repository';
import { RepositoryMixin } from '../repository/repository.mixin';
import { DYNAMIC_ENTITY_METADATA, DynamicEntityMetadata } from './dynamic-entity.decorator';

export const DynamicRepositoryMixin = <
  AppEntity extends IdEntity,
  AppModel extends BasicAggregateRoot,
>(
  entityClass: Type<AppEntity>,
  modelClass: Type<AppModel>
) => {
  const metadata = DYNAMIC_ENTITY_METADATA.get(entityClass);
  if (!metadata) {
    throw new Error(
      `${entityClass.name} is not a dynamic entity. ` +
      `Make sure it's decorated with @DynamicEntity.`
    );
  }
  const config: DynamicEntityMetadata = metadata;

  @Injectable()
  class DynamicRepositoryImpl {
    readonly #repositoryCache = new Map<string, AppRepository<AppEntity, AppModel>>();
    readonly #collectionReadyCache = new Map<string, Promise<void>>();
    readonly #dataSource: DataSource;

    constructor(@InjectDataSource() dataSource: DataSource) {
      this.#dataSource = dataSource;
      const appRepoMethods = new Set([
        'save', 'find', 'findOne', 'findBy', 'findOneBy', 'findAndCount',
        'count', 'countBy', 'update', 'delete', 'softDelete', 'restore',
        'createQueryBuilder', 'query', 'clear'
      ]);

      return new Proxy(this, {
        get: (target, prop: string | symbol) => {
          if (typeof prop === 'string' && (
            prop === 'dataSource' || prop === 'repositoryCache' || prop === 'collectionReadyCache' ||
            prop === 'extractId' || prop === 'getRepositoryForId' || prop === 'createDynamicRepository' ||
            prop === 'getMongoClient' || prop === 'ensureCollectionReady' || prop === 'ensureIndexes' ||
            prop === 'initCollection' || prop === 'destroyCollection'
          )) {
            const value = (target as any)[prop];
            return typeof value === 'function' ? value.bind(target) : value;
          }

          if (typeof prop === 'string' && (prop === 'init' || prop === 'destroy')) {
            return async (id?: any) => {
              if (id === undefined || id === null) {
                return Promise.reject(new Error('ID is required for init/destroy operations'));
              }
              if (prop === 'init') return target.#initCollection(id);
              else return target.#destroyCollection(id);
            };
          }

          if (typeof prop === 'string' && appRepoMethods.has(prop)) {
            return async (...args: any[]) => {
              const id = target.#extractId(args);
              await target.#ensureCollectionReady(id);
              const repo = target.#getRepositoryForId(id);
              return (repo as any)[prop](...args);
            };
          }

          return (target as any)[prop];
        }
      });
    }

    #extractId(args: any[]): any {
      if (!args || args.length === 0) {
        throw new Error(
          `Cannot extract ${config.idField} from empty arguments. ` +
          `Dynamic repositories require ${config.idField} in all operations.`
        );
      }
      const firstArg = args[0];
      if (firstArg === null || firstArg === undefined) {
        throw new Error(`Cannot extract ${config.idField} from null/undefined argument.`);
      }
      if (Array.isArray(firstArg)) {
        if (firstArg.length === 0) throw new Error(`Cannot extract ${config.idField} from empty array`);
        const id = firstArg[0][config.idField];
        if (id) return id;
      }
      let id = firstArg[config.idField];
      if (id) return id;
      if (firstArg.where) {
        id = firstArg.where[config.idField];
        if (id) return id;
        if (Array.isArray(firstArg.where)) {
          for (const whereClause of firstArg.where) {
            id = whereClause[config.idField];
            if (id) return id;
          }
        }
      }
      throw new Error(
        `Cannot extract ${config.idField} from argument. ` +
        `Dynamic repositories require ${config.idField} to route to the correct collection.`
      );
    }

    async #ensureCollectionReady(id: any): Promise<void> {
      const cacheKey = `${id.toString()}_${config.entityClass.name}`;
      const cachedPromise = this.#collectionReadyCache.get(cacheKey);
      if (cachedPromise) return cachedPromise;

      const collectionName = config.collectionNameGenerator(id.toString());
      const readyPromise = (async () => {
        if (this.#dataSource.driver.options.type === 'mongodb') {
          try {
            const db = this.#getMongoClient().db();
            const collection = db.collection(collectionName);
            await this.#ensureIndexes(collectionName);
            const collections = await db.listCollections({ name: collectionName }).toArray();
            if (collections.length === 0) {
              await collection.insertOne({ _temp: true });
              await collection.deleteOne({ _temp: true });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) { /* collection will be created on insert */ }
        }
      })();

      this.#collectionReadyCache.set(cacheKey, readyPromise);
      await readyPromise;
    }

    #getRepositoryForId(id: any): AppRepository<AppEntity, AppModel> {
      const cacheKey = `${id.toString()}_${config.entityClass.name}`;
      if (this.#repositoryCache.has(cacheKey)) {
        const cached = this.#repositoryCache.get(cacheKey);
        if (cached) return cached;
      }
      const collectionName = config.collectionNameGenerator(id.toString());
      const repository = this.#createDynamicRepository(collectionName);
      this.#repositoryCache.set(cacheKey, repository);
      return repository;
    }

    #getMongoClient(): any {
      return (this.#dataSource.driver as any).queryRunner.databaseConnection;
    }

    async #initCollection(id: any): Promise<void> {
      await this.#ensureCollectionReady(id);
    }

    async #destroyCollection(id: any): Promise<void> {
      const cacheKey = `${id.toString()}_${config.entityClass.name}`;
      const collectionName = config.collectionNameGenerator(id.toString());
      this.#repositoryCache.delete(cacheKey);
      this.#collectionReadyCache.delete(cacheKey);

      if (this.#dataSource.driver.options.type === 'mongodb') {
        try {
          const db = this.#getMongoClient().db();
          const collection = db.collection(collectionName);
          const collections = await db.listCollections({ name: collectionName }).toArray();
          if (collections.length > 0) await collection.drop();
        } catch (error) {
          throw new Error(`Failed to drop collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    async #ensureIndexes(collectionName: string): Promise<void> {
      const collection = this.#getMongoClient().db().collection(collectionName);
      const typeormMetadata = this.#dataSource.getMetadata(entityClass);
      const indexes: any[] = [];

      if (typeormMetadata.indices && typeormMetadata.indices.length > 0) {
        for (const index of typeormMetadata.indices) {
          const indexKey: any = {};
          for (const col of index.columns) {
            const columnName = typeof col === 'string' ? col : col.propertyName;
            indexKey[columnName] = 1;
          }
          indexes.push({ key: indexKey, unique: index.isUnique || false, sparse: index.isSparse || false, name: index.name });
        }
      }

      if (typeormMetadata.columns) {
        for (const column of typeormMetadata.columns) {
          if ((column as any).isUnique) {
            indexes.push({ key: { [column.propertyName]: 1 }, unique: true, sparse: false });
          }
        }
      }

      if (config.textSearchFields && config.textSearchFields.length > 0) {
        indexes.push({ key: Object.fromEntries(config.textSearchFields.map((f) => [f, 'text'])), name: 'text_search_idx' });
      }

      const columnNames = typeormMetadata.columns.map(c => c.propertyName);
      if (columnNames.includes('deletedAt')) indexes.push({ key: { deletedAt: 1 }, sparse: true });
      if (columnNames.includes('createdAt')) indexes.push({ key: { createdAt: -1 } });
      if (columnNames.includes('updatedAt')) indexes.push({ key: { updatedAt: -1 } });

      if (indexes.length > 0) await collection.createIndexes(indexes);
    }

    #createDynamicRepository(collectionName: string): AppRepository<AppEntity, AppModel> {
      const baseRepo = this.#dataSource.getRepository(entityClass);
      const originalMetadata = this.#dataSource.getMetadata(entityClass);

      if (this.#dataSource.driver.options.type !== 'mongodb') {
        const RepositoryClass = RepositoryMixin(entityClass, modelClass);
        return new RepositoryClass(baseRepo);
      }

      const metadataProxy = new Proxy(originalMetadata, {
        get: (metaTarget, metaProp) => {
          if (metaProp === 'tableName' || metaProp === 'tableNameWithoutPrefix' || metaProp === 'givenTableName') {
            return collectionName;
          }
          return Reflect.get(metaTarget, metaProp as string | symbol);
        }
      });

      const connectionProxy = new Proxy(this.#dataSource, {
        get: (dsTarget, dsProp) => {
          if (dsProp === 'getMetadata') {
            return (entityTarget: unknown) => {
              if (entityTarget === entityClass || (entityTarget && typeof entityTarget === 'function' && (entityTarget as any).name === entityClass.name)) {
                return metadataProxy;
              }
              return this.#dataSource.getMetadata(entityTarget as never);
            };
          }
          return Reflect.get(dsTarget, dsProp as string | symbol);
        }
      });

      const managerProxy = new Proxy(baseRepo.manager, {
        get: (managerTarget, managerProp) => {
          if (managerProp === 'connection') return connectionProxy;
          return Reflect.get(managerTarget, managerProp as string | symbol);
        }
      });

      const proxiedRepo = new Proxy(baseRepo, {
        get: (target, prop) => {
          if (prop === 'metadata') return metadataProxy;
          if (prop === 'manager') return managerProxy;
          return Reflect.get(target, prop as string | symbol);
        }
      });

      const RepositoryClass = RepositoryMixin(entityClass, modelClass);
      return new RepositoryClass(proxiedRepo);
    }
  }

  return mixin(DynamicRepositoryImpl) as any;
};
