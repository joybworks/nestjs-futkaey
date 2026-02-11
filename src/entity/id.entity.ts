/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Abstract base entity providing primary key and JSON serialization.
 * Users must declare their own primary key with the appropriate TypeORM decorator:
 *
 * For MongoDB:
 *   @ObjectIdColumn({ name: '_id' }) id: ObjectId;
 *
 * For SQL:
 *   @PrimaryGeneratedColumn('uuid') id: string;
 */
export abstract class IdEntity {
  abstract id: any;

  toJSON(): any {
    const jsonObj: Record<string, any> = {};

    for (const key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        let value = (this as any)[key];

        // Convert ObjectId-like values to string (has toString and toHexString)
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
