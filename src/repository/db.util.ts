/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Creates a value suitable for the entity `id` column.
 * Document drivers return a native id type; relational drivers return a UUID string.
 */
export const newId = (inputId?: string | any): any => {
  try {
    const { ObjectId } = require('mongodb');
    return new ObjectId(inputId);
  } catch {
    return inputId ?? generateUUID();
  }
};

/**
 * Check if a value is a valid primary key for the active document driver.
 * Relational id strings (e.g. UUID) are not validated here.
 */
export const isDatabaseId = (inputId: any): boolean => {
  if (!inputId) return false;
  try {
    const { ObjectId } = require('mongodb');
    if (inputId instanceof ObjectId) return true;
    if (typeof inputId === 'string') {
      return !!new ObjectId(inputId);
    }
  } catch {
    // Not a valid ObjectId
  }
  return false;
};

/**
 * Convert a value to a Date for database storage
 */
export const toDate = (v: unknown): Date | undefined => {
  if (v instanceof Date) return v;
  return v ? new Date(v as string) : undefined;
};

/** Zero-value sentinel for document-driver `id` columns (24-char hex). */
export const SYSTEM_USER_ID_MONGO = '000000000000000000000000';
/** Zero-value sentinel for relational-driver `id` columns (nil UUID). */
export const SYSTEM_USER_ID_SQL = '00000000-0000-0000-0000-000000000000';

/**
 * Default system user ID for the given database driver `id` column format.
 * Document drivers use a 24-char hex id; relational drivers use the nil UUID.
 */
export const getDefaultSystemUserId = (databaseType?: string): string =>
  databaseType === 'mongodb' ? SYSTEM_USER_ID_MONGO : SYSTEM_USER_ID_SQL;

/**
 * Returns true when the repository uses a document driver whose primary key
 * column name differs from the entity `id` property (e.g. maps `id` → `_id`).
 */
export const isMongoDriver = (repository: any): boolean => {
  try {
    const connType = repository?.manager?.connection?.options?.type;
    return connType === 'mongodb';
  } catch {
    return false;
  }
};

/**
 * Escape SQL LIKE pattern to regex pattern
 */
export const escapeLikeToRegex = (pattern: string): string => {
  // Convert SQL LIKE pattern (% and _) to regex
  return pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/%/g, '.*')                       // % -> .*
    .replace(/_/g, '.');                       // _ -> .
};

/** Alias for {@link newId}. */
export const newDatabaseId = newId;

/**
 * Alias for toDate
 */
export const toDateForDatabase = toDate;

/**
 * Primary key value for an entity `id` column.
 * Shape depends on the TypeORM driver (UUID string, number, document id, etc.).
 *
 * @example
 * import type { DatabaseId } from '@joyb-works/nestjs-futkaey';
 */
export type DatabaseId = any;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
