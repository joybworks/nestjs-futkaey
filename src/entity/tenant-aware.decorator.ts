import 'reflect-metadata';
import { MetadataKeys } from '../config/nestjs-futkaey.constants';

/**
 * Marks an entity class as tenant-aware.
 * Entities decorated with @TenantAware() will have automatic tenant field
 * filtering on reads and injection on writes.
 *
 * Users must declare their own tenant column(s) with names matching
 * the module configuration.
 *
 * @example
 * ```typescript
 * @TenantAware()
 * @Entity('projects')
 * export class ProjectEntity extends AuditableEntity {
 *   @ObjectIdColumn({ name: '_id' }) id: ObjectId;
 *   @Column() companyId: ObjectId;  // matches config tenant.fieldName
 * }
 * ```
 */
export function TenantAware(): ClassDecorator {
  return (target: NewableFunction) => {
    Reflect.defineMetadata(MetadataKeys.TenantAware, true, target);
  };
}

/**
 * Checks if an entity class or instance is marked as tenant-aware.
 * Traverses the prototype chain to support inheritance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTenantAware(obj: any): boolean {
  if (!obj) return false;

  const target = typeof obj === 'function' ? obj : obj.constructor;

  let current = target;
  while (current && current !== Object) {
    if (Reflect.getMetadata(MetadataKeys.TenantAware, current)) {
      return true;
    }
    current = Object.getPrototypeOf(current);
  }

  return false;
}
