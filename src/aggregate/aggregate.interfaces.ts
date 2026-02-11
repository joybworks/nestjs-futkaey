import { ColumnType } from 'typeorm';

export enum DomainAccess {
  Create = 0,
  Read = 1,
  Update = 2,
  Delete = 3,
  Sync = 4,
}

export enum AggregateContext {
  Context = 'context',
  Basic = 'basic',
  /** @alias Context - generic name for multi-tenant mode */
  Tenant = 'context',
}

export interface AggregatePropertyOptions {
  type?: ColumnType | 'id' | 'date' | 'datetime';
  enum?: (string | number)[] | object;
  nullable?: boolean;
  array?: boolean;
}

/**
 * Tenant field name: consumer refines to a literal like 'companyId' | 'tenantId' | 'customerId'.
 * Used so the package does not hardcode a tenant id field name.
 */
export type TenantFieldName = string;

/**
 * Context payload provided by aggregate root for event publishing.
 * Generic TenantKey is the name of the primary tenant id field (e.g. 'companyId', 'tenantId').
 * Consumer provides this via their type; runtime key comes from hierarchy config (first level fieldName).
 */
export type DomainEventContext<TenantKey extends TenantFieldName = TenantFieldName> = {
  tenantContext?: Record<string, string>;
  userId: string | null;
  timestamp: string | null;
  correlationId?: string;
  modifier: DomainAccess;
} & Record<TenantKey, string | undefined>;
