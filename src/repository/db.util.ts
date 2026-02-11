/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Creates a new database ID. For MongoDB, creates an ObjectId.
 * Falls back to returning the input string if MongoDB is not available.
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
 * Check if a value is a valid database ID (ObjectId-like)
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

/**
 * Determine if the repository is using a MongoDB driver
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

/**
 * Alias for newId
 */
export const newDatabaseId = newId;

/**
 * Alias for toDate
 */
export const toDateForDatabase = toDate;

/**
 * DatabaseId type - alias for MongoDB ObjectId.
 * Use `import type { DatabaseId } from '@joyb-works/nestjs-futkaey'`
 */
export type DatabaseId = any;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
