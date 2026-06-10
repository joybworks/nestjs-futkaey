/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Map the entity `id` property to the driver's primary key column when they differ.
 * No-op for relational drivers where the column is also named `id`.
 *
 * @param forMongo When true, remap `id` to the document-driver column (e.g. `_id`).
 */
export const sanitizeId = <T>(doc: T, forMongo = false): T => {
  if (!forMongo) return doc;
  const docTyped: any = doc as any;
  if (docTyped.id !== undefined && docTyped.id !== null) {
    docTyped._id = docTyped.id;
    delete docTyped.id;
    return docTyped as T;
  }
  return doc as T;
};

/** Remove `id` and any driver-mapped primary key alias before update operations. */
export const removeIdForUpdate = <T>(doc: T): T => {
  const docTyped: any = doc as any;
  const { id: _id, _id: _mongoId, ...rest } = docTyped;
  return rest as T;
};

/** Restore `id` from the driver-mapped primary key column after update operations. */
export const putBackIdForUpdate = <T>(doc: T): T => {
  const docTyped: any = doc as any;
  if (docTyped._id) {
    docTyped.id = docTyped._id;
    delete docTyped._id;
  }
  return docTyped as T;
};
