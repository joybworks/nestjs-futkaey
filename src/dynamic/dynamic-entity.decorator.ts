/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@nestjs/common';
import { Entity } from 'typeorm';

export const DYNAMIC_ENTITY_METADATA = new Map<Type<any>, DynamicEntityMetadata>();

export interface DynamicEntityMetadata {
  baseCollectionName: string;
  collectionNameGenerator: (id: string) => string;
  entityClass: Type<any>;
  idField: string;
  textSearchFields?: string[];
  /**
   * Marks this dynamic entity as read-only: the generated repository only
   * exposes find/count/query-style methods (no save/insert/update/upsert/
   * delete/softDelete/restore/increment/decrement/remove/softRemove/
   * recover/clear), and `init`/`destroy` (collection lifecycle) are
   * rejected rather than attempted.
   */
  readOnly?: boolean;
}

export function DynamicEntity(
  options:
    | { baseName: string; idField: string; textSearchFields?: string[]; readOnly?: boolean }
    | { collectionNameGenerator: (id: string) => string; textSearchFields?: string[]; idField: string; readOnly?: boolean }
): ClassDecorator {
  return (target: any) => {
    let idField: string;
    let collectionNameGenerator: (id: string) => string;
    let baseCollectionName: string;

    if ('baseName' in options && 'idField' in options) {
      idField = options.idField;
      baseCollectionName = options.baseName;
      collectionNameGenerator = (id: string) => `${options.baseName}_${id}`;
    } else if ('collectionNameGenerator' in options) {
      collectionNameGenerator = options.collectionNameGenerator;
      const funcStr = collectionNameGenerator.toString();
      const paramMatch = funcStr.match(/\(([^)]+)\)|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
      idField = options.idField ?? (paramMatch ? (paramMatch[1] || paramMatch[2]).trim() : 'id');
      baseCollectionName = collectionNameGenerator('default');
    } else {
      throw new Error(
        `${target.name}: @DynamicEntity requires either ` +
        `{baseName, idField} or {collectionNameGenerator, idField}`
      );
    }

    DYNAMIC_ENTITY_METADATA.set(target, {
      baseCollectionName,
      collectionNameGenerator,
      entityClass: target,
      idField,
      textSearchFields: options.textSearchFields,
      readOnly: options.readOnly ?? false,
    });

    const entityDecorator = Entity({ name: baseCollectionName });
    return entityDecorator(target);
  };
}

export function getDynamicEntityClass<T>(entityClass: Type<T>, id: string): Type<T> {
  const metadata = DYNAMIC_ENTITY_METADATA.get(entityClass);
  if (!metadata) {
    throw new Error(`Entity ${entityClass.name} is not decorated with @DynamicEntity.`);
  }
  const collectionName = metadata.collectionNameGenerator(id);
  const DynamicClass = class extends (entityClass as any) {
    static __collectionName = collectionName;
    static __isDynamic = true;
    static __baseClass = entityClass;
  };
  Object.defineProperty(DynamicClass, 'name', { value: `${entityClass.name}_${id}`, writable: false });
  return DynamicClass as unknown as Type<T>;
}

export function isDynamicEntity(entityClass: Type<any>): boolean {
  return DYNAMIC_ENTITY_METADATA.has(entityClass);
}

export function getDynamicCollectionName(entityClass: Type<any>, id: string): string {
  const metadata = DYNAMIC_ENTITY_METADATA.get(entityClass);
  if (!metadata) throw new Error(`Entity ${entityClass.name} is not a dynamic entity`);
  return metadata.collectionNameGenerator(id);
}
