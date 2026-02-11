/* eslint-disable @typescript-eslint/no-explicit-any */
import { getContextFields, getHierarchyLevels, getSystemUserId, isRegularMode } from '../config/nestjs-futkaey.accessor';
import { sanitizeId } from '../entity/entity.util';
import { isTenantAware } from '../entity/tenant-aware.decorator';
import { newId } from './db.util';

/**
 * Get the tenant context value for a specific field from CLS
 */
function getContextValue(headerOrKey: string): string | undefined {
  try {
    const { ClsServiceManager } = require('nestjs-cls');
    const cls = ClsServiceManager.getClsService();
    return cls?.get(headerOrKey) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the tenant ID as a database ID for the given hierarchy level
 */
function getTenantId(clsKey: string): any | undefined {
  const value = getContextValue(clsKey);
  if (!value) return undefined;
  try {
    return newId(value);
  } catch {
    return value;
  }
}

/**
 * Contextualize a single document/query with tenant fields.
 * In regular mode, only sanitizes IDs.
 * In tenant modes, injects configured tenant field values.
 */
export function contextualize<T>(
  entityClass: any,
  doc: T,
  access: 'read' | 'write' = 'read'
): T {
  const docTyped: any = doc as any;

  const contextFields = getContextFields();
  for (const field of contextFields) {
    const applyOn = field.applyOn ?? 'write';
    const shouldApply = access === 'write'
      ? (applyOn === 'write' || applyOn === 'both')
      : (applyOn === 'read' || applyOn === 'both');
    if (shouldApply) {
      const value = field.getValue();
      if (value !== undefined) {
        docTyped[field.fieldName] = value;
      }
    }
  }

  if (isRegularMode() || !isTenantAware(entityClass)) {
    return sanitizeId(docTyped);
  }

  const levels = getHierarchyLevels();
  const systemUserId = getSystemUserId();

  for (const level of levels) {
    const clsKey = level.clsKey ?? level.headerName;
    const tenantValue = getTenantId(clsKey);

    const isSystemUser = tenantValue
      ? (typeof tenantValue === 'string'
        ? tenantValue === systemUserId
        : tenantValue?.toString() === systemUserId)
      : true;

    if (access === 'write') {
      const currentValue = docTyped[level.fieldName];
      const isCurrentSystemOrEmpty = !currentValue || (
        typeof currentValue === 'string'
          ? currentValue === systemUserId
          : currentValue?.toString() === systemUserId
      );
      if (tenantValue && isCurrentSystemOrEmpty) {
        docTyped[level.fieldName] = tenantValue;
      } else if (!currentValue) {
        try {
          docTyped[level.fieldName] = newId(systemUserId);
        } catch {
          docTyped[level.fieldName] = systemUserId;
        }
      }
    } else if (tenantValue && !isSystemUser) {
      docTyped[level.fieldName] = tenantValue;
    }
  }

  return sanitizeId(docTyped);
}

/**
 * Contextualize an array of documents
 */
export function contextualizeArray<T>(
  entityClass: any,
  docs: T[],
  access: 'read' | 'write' = 'read'
): T[] {
  return docs.map(doc => contextualize(entityClass, doc, access));
}
