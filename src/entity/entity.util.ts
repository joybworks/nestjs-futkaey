/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert the `id` property to `_id` for MongoDB writes.
 * Database-agnostic: only converts if `id` exists.
 */
export const sanitizeId = <T>(doc: T): T => {
  const docTyped: any = doc as any;
  if (docTyped.id !== undefined && docTyped.id !== null) {
    docTyped._id = docTyped.id;
    delete docTyped.id;
    return docTyped as T;
  }
  return doc as T;
};

/**
 * Remove id and _id fields before update operations.
 */
export const removeIdForUpdate = <T>(doc: T): T => {
  const docTyped: any = doc as any;
  const { id: _id, _id: _mongoId, ...rest } = docTyped;
  return rest as T;
};

/**
 * Restore id from _id after update operations.
 */
export const putBackIdForUpdate = <T>(doc: T): T => {
  const docTyped: any = doc as any;
  if (docTyped._id) {
    docTyped.id = docTyped._id;
    delete docTyped._id;
  }
  return docTyped as T;
};
