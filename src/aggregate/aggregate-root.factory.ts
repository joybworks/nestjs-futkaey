import { mixin, Type } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { AggregateContext } from './aggregate.interfaces';
import { BasicAggregateRoot, TenantAggregateRoot } from './aggregate-root';

export function AggregateRootMixin<EventBase extends IEvent = IEvent>(
  type: AggregateContext.Basic
): Type<BasicAggregateRoot<EventBase>>;
export function AggregateRootMixin<EventBase extends IEvent = IEvent>(
  type: AggregateContext.Tenant
): Type<TenantAggregateRoot<EventBase>>;
export function AggregateRootMixin<EventBase extends IEvent = IEvent>(
  type: AggregateContext
): Type<BasicAggregateRoot<EventBase>> | Type<TenantAggregateRoot<EventBase>> {
  if (type === AggregateContext.Tenant) {
    return mixin(TenantAggregateRoot<EventBase>);
  }
  return mixin(BasicAggregateRoot<EventBase>);
}
