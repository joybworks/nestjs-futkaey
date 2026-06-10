import { getDefaultSystemUserId } from '../repository/db.util';
import { DEFAULT_AUDIT_CONFIG } from './nestjs-futkaey.constants';
import { AuditConfig, ContextFieldConfig, HierarchyLevel, NestjsFutkaeyModuleOptions, TenancyConfig } from './nestjs-futkaey.interfaces';

function getContextProviderSafe(): unknown {
  try {
    const { ClsServiceManager } = require('nestjs-cls');
    return ClsServiceManager.getClsService();
  } catch {
    return null;
  }
}

/** Read a value from request context (CLS). Used by aggregate root and by app mixins */
export function getContextValue(headerOrKey: string): string | undefined {
  const cls = getContextProviderSafe() as { get(key: string): string } | null;
  if (!cls) return undefined;
  return cls.get(headerOrKey) ?? undefined;
}

let _moduleOptions: NestjsFutkaeyModuleOptions | null = null;

export function setModuleOptions(options: NestjsFutkaeyModuleOptions): void {
  _moduleOptions = options;
}

export function getModuleOptions(): NestjsFutkaeyModuleOptions {
  if (!_moduleOptions) {
    return { tenancy: { mode: 'regular' } };
  }
  return _moduleOptions;
}

export function getTenancyConfig(): TenancyConfig {
  return getModuleOptions().tenancy;
}

export function getAuditConfig(): AuditConfig {
  return { ...DEFAULT_AUDIT_CONFIG, ...getModuleOptions().audit };
}

/** Context fields to apply during write/read. For use in contextualize. */
export function getContextFields(): ContextFieldConfig[] {
  return getAuditConfig().contextFields ?? [];
}

export function getSystemUserId(): string {
  const options = getModuleOptions();
  if (options.systemUserId) {
    return options.systemUserId;
  }
  const config = getTenancyConfig();
  if (config.mode === 'multi-tenant' || config.mode === 'custom-hierarchy') {
    if (config.systemUserId) {
      return config.systemUserId;
    }
  }
  return getDefaultSystemUserId(options.databaseType);
}

export function getHierarchyLevels(): HierarchyLevel[] {
  const config = getTenancyConfig();
  if (config.mode === 'multi-tenant') {
    return [config.tenant];
  }
  if (config.mode === 'custom-hierarchy') {
    return config.hierarchy;
  }
  return [];
}

export function isRegularMode(): boolean {
  return getTenancyConfig().mode === 'regular';
}
