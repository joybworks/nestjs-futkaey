export const NESTJS_FUTkaey_OPTIONS = Symbol('NESTJS_FUTkaey_OPTIONS');
export const NESTJS_FUTkaey_CONTEXT_PROVIDER = Symbol('NESTJS_FUTkaey_CONTEXT_PROVIDER');

export const MetadataKeys = {
  AggregateProperty: '__model_aggregate_property__',
  AggregateProperties: '__model_aggregate_properties__',
  TenantAware: '__nestjs_futkaey_tenant_aware__',
  PublicRoute: '__public_route__',
  RequiresContext: '__requires_context__',
  DynamicEntityMeta: '__nestjs_futkaey_dynamic_entity__',
} as const;

export const SYSTEM_USER_ID_DEFAULT = '000000000000000000000000';

export const DEFAULT_AUDIT_CONFIG = {
  userIdHeader: 'x-user-id',
  correlationIdHeader: 'x-correlation-id',
  enableSoftDelete: true,
} as const;
