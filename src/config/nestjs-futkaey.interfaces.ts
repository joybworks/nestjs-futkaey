export type TenancyMode = 'regular' | 'multi-tenant' | 'custom-hierarchy';

export interface HierarchyLevel {
  /** The entity field name, e.g. "companyId", "tenantId", "partnerId" */
  fieldName: string;
  /** The HTTP header name to extract, e.g. "x-company-id", "x-tenant-id" */
  headerName: string;
  /** CLS storage key, defaults to headerName if not provided */
  clsKey?: string;
  /** Whether this level must be present in request context (default: true) */
  required?: boolean;
}

export interface RegularModeConfig {
  mode: 'regular';
}

export interface MultiTenantModeConfig {
  mode: 'multi-tenant';
  tenant: HierarchyLevel;
  systemUserId?: string;
}

export interface CustomHierarchyModeConfig {
  mode: 'custom-hierarchy';
  hierarchy: HierarchyLevel[];
  systemUserId?: string;
}

export type TenancyConfig = RegularModeConfig | MultiTenantModeConfig | CustomHierarchyModeConfig;

/**
 * Configurable context field: applied during contextualize (entity save/read).
 * Consumer registers fields like traceId, etc.
 */
export interface ContextFieldConfig {
  /** Entity/doc property name */
  fieldName: string;
  /** Provider for write. Called during contextualize(access='write'). */
  getValue: () => string | undefined;
  /** When to apply: 'write' (default), 'read', or 'both' */
  applyOn?: 'write' | 'read' | 'both';
}

export interface AuditConfig {
  /** Header name for user ID (default: 'x-user-id') */
  userIdHeader?: string;
  /** CLS key for user ID (default: same as header) */
  userIdClsKey?: string;
  /** Header name for correlation ID (default: 'x-correlation-id') */
  correlationIdHeader?: string;
  /** Whether entities support soft delete (default: true) */
  enableSoftDelete?: boolean;
  /**
   * Custom context fields for entity persistence.
   * Each field's getValue() is called during write (and read when applyOn includes 'read').
   * E.g. [{ fieldName: 'headerField', getValue: () => cls.get('header-field') }]
   */
  contextFields?: ContextFieldConfig[];
}

export interface NestjsFutkaeyModuleOptions {
  tenancy: TenancyConfig;
  audit?: AuditConfig;
}

export interface NestjsFutkaeyAsyncOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory: (...args: any[]) => NestjsFutkaeyModuleOptions | Promise<NestjsFutkaeyModuleOptions>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
}
