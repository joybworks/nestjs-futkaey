/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Abstract base entity providing primary key and JSON serialization.
 * Declare the `id` property with the TypeORM decorator for your driver:
 *
 * Relational drivers:
 *   @PrimaryGeneratedColumn('uuid') id: string;
 *
 * Document drivers (entity property stays `id`; column may be `_id`):
 *   @ObjectIdColumn({ name: '_id' }) id: DatabaseId;
 */
export abstract class IdEntity {
  abstract id: any;

  toJSON(): any {
    const jsonObj: Record<string, any> = {};

    for (const key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        let value = (this as any)[key];

        // Convert document-driver id values to string (has toString and toHexString)
        if (value && typeof value === 'object' && typeof value.toHexString === 'function') {
          value = value.toString();
        }
        // Convert Date to ISO string
        else if (value instanceof Date) {
          value = value.toISOString();
        }
        // Handle arrays
        else if (Array.isArray(value)) {
          value = value.map((item: any) => {
            if (item && typeof item === 'object' && typeof item.toHexString === 'function') {
              return item.toString();
            } else if (item instanceof Date) {
              return item.toISOString();
            }
            return item;
          });
        }

        jsonObj[key] = value;
      }
    }

    return jsonObj;
  }
}
