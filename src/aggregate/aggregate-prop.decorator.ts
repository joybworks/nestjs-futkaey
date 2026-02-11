import 'reflect-metadata';
import { MetadataKeys } from '../config/nestjs-futkaey.constants';
import { AggregatePropertyOptions } from './aggregate.interfaces';

/**
 * Marks a property on an aggregate root with type metadata.
 * Used by MarshallerMixin to convert between entity and domain model.
 *
 * @example
 * ```typescript
 * class UserModel extends AggregateRootMixin(AggregateContext.Tenant) {
 *   @AggregateProp({ type: 'id' }) id!: string;
 *   @AggregateProp({ type: 'string' }) name!: string;
 *   @AggregateProp({ type: 'datetime' }) createdAt!: string;
 * }
 * ```
 */
export const AggregateProp = (opts?: AggregatePropertyOptions): PropertyDecorator => {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(MetadataKeys.AggregateProperty, opts, target, key);

    const constructor = target.constructor;
    const props: Record<string, AggregatePropertyOptions | undefined> = {
      ...Reflect.getMetadata(MetadataKeys.AggregateProperties, constructor.prototype) ?? {},
      ...Reflect.getMetadata(MetadataKeys.AggregateProperties, constructor) ?? {},
      [key]: opts,
    };
    Reflect.defineMetadata(MetadataKeys.AggregateProperties, props, constructor);
  };
};
