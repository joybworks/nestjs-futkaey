// Config
export { getAuditConfig, getContextFields, getContextValue, getHierarchyLevels, getModuleOptions, getSystemUserId, getTenancyConfig, isRegularMode, setModuleOptions } from './config/nestjs-futkaey.accessor';
export { MetadataKeys, NESTJS_FUTkaey_CONTEXT_PROVIDER, NESTJS_FUTkaey_OPTIONS, SYSTEM_USER_ID_DEFAULT } from './config/nestjs-futkaey.constants';
export {
  AuditConfig,
  ContextFieldConfig, CustomHierarchyModeConfig,
  HierarchyLevel, MultiTenantModeConfig, NestjsFutkaeyAsyncOptions, NestjsFutkaeyModuleOptions, RegularModeConfig, TenancyConfig,
  TenancyMode
} from './config/nestjs-futkaey.interfaces';
export { NestjsFutkaeyModule } from './config/nestjs-futkaey.module';

// Context
export { ClsContextProvider } from './context/cls-context.provider';
export { ContextRequirement, Public, RequiresContext, TenantScoped } from './context/context.decorators';
export { IContextProvider } from './context/context.interface';
export { ContextMiddleware } from './context/context.middleware';
export { NoopContextProvider } from './context/noop-context.provider';

// Entity
export { AuditableEntity } from './entity/auditable.entity';
export { putBackIdForUpdate, removeIdForUpdate, sanitizeId } from './entity/entity.util';
export { IdEntity } from './entity/id.entity';
export { TenantAware, isTenantAware } from './entity/tenant-aware.decorator';

// Aggregate
export { AggregateProp } from './aggregate/aggregate-prop.decorator';
export { BasicAggregateRoot, TenantAggregateRoot } from './aggregate/aggregate-root';
export { AggregateRootMixin } from './aggregate/aggregate-root.factory';
export { AggregateContext, AggregatePropertyOptions, DomainAccess, DomainEventContext, TenantFieldName } from './aggregate/aggregate.interfaces';

// Repository
export { AppRepository } from './repository/app.repository';
export { contextualize, contextualizeArray } from './repository/contextualize.util';
export { escapeLikeToRegex, isDatabaseId, isMongoDriver, newDatabaseId, newId, toDate, toDateForDatabase } from './repository/db.util';
export type { DatabaseId } from './repository/db.util';
export { DomainEntityInterface, MarshallerMixin } from './repository/marshaller.mixin';
export { RepositoryMixin } from './repository/repository.mixin';

// Dynamic
export { DYNAMIC_ENTITY_METADATA, DynamicEntity, DynamicEntityMetadata, getDynamicCollectionName, getDynamicEntityClass, isDynamicEntity } from './dynamic/dynamic-entity.decorator';
export { DynamicRepositoryMixin } from './dynamic/dynamic-repository.mixin';
export { DynamicRepository } from './dynamic/dynamic.repository';

// Operators
export { Regex } from './operators/operators';

// Re-export NestJS CQRS essentials for convenience
export { CommandBus, CqrsModule, EventBus, EventPublisher, QueryBus } from '@nestjs/cqrs';
