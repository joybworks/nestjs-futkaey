import { AggregateRoot as CoreAggregateRoot, IEvent } from '@nestjs/cqrs';
import 'reflect-metadata';
import { getAuditConfig, getContextValue, getHierarchyLevels, getSystemUserId } from '../config/nestjs-futkaey.accessor';
import { MetadataKeys } from '../config/nestjs-futkaey.constants';
import { AggregateProp } from './aggregate-prop.decorator';
import { AggregatePropertyOptions, DomainAccess, DomainEventContext } from './aggregate.interfaces';

export class BasicAggregateRoot<EventBase extends IEvent = IEvent> extends CoreAggregateRoot<EventBase> {
  modifier: DomainAccess;

  @AggregateProp({ type: 'id' }) id!: string;
  @AggregateProp({ type: 'id' }) createdBy!: string;
  @AggregateProp({ type: 'datetime' }) createdAt!: string;
  @AggregateProp({ type: 'id' }) updatedBy!: string;
  @AggregateProp({ type: 'datetime' }) updatedAt!: string;
  @AggregateProp({ type: 'id' }) deletedBy?: string;
  @AggregateProp({ type: 'datetime' }) deletedAt?: string;

  getAggregateProperties<T>(): Record<keyof T, AggregatePropertyOptions | undefined> {
    return Reflect.getMetadata(MetadataKeys.AggregateProperties, this.constructor) ?? {};
  }

  static getAggregateProperties<T>(): Record<keyof T, AggregatePropertyOptions | undefined> {
    return Reflect.getMetadata(MetadataKeys.AggregateProperties, this) ?? {};
  }

  constructor(access: DomainAccess) {
    super();
    this.modifier = access;
    this.#setAccess(access);
  }

  set access(access: DomainAccess) {
    this.modifier = access;
    this.#setAccess(access);
  }

  get access(): DomainAccess {
    return this.modifier;
  }

  /**
   * Override to add app-specific context Default returns context unchanged.
   */
  protected extendContext(context: DomainEventContext): DomainEventContext {
    return context;
  }

  /**
   * Override to run logic after access is set (e.g. set variables from header). Default no-op.
   */
  protected onSetAccess(_access: DomainAccess): void {
    // no-op; consumer overrides to add variables or other setup
  }

  get context(): DomainEventContext {
    const auditConfig = getAuditConfig();
    const systemUserId = getSystemUserId();
    const userIdKey = auditConfig.userIdClsKey ?? auditConfig.userIdHeader ?? 'x-user-id';
    const correlationKey = auditConfig.correlationIdHeader ?? 'x-correlation-id';

    // Build tenant context
    const tenantContext: Record<string, string> = {};
    const levels = getHierarchyLevels();
    for (const level of levels) {
      const clsKey = level.clsKey ?? level.headerName;
      const value = getContextValue(clsKey);
      if (value) {
        tenantContext[level.fieldName] = value;
      } else {
        tenantContext[level.fieldName] = systemUserId;
      }
    }

    // Primary tenant id: key comes from first hierarchy level (consumer chooses in config)
    const firstLevel = levels.length > 0 ? levels[0] : null;
    const primaryKey = firstLevel?.fieldName ?? 'companyId';
    const primaryValue = firstLevel
      ? (tenantContext[firstLevel.fieldName] ?? systemUserId)
      : systemUserId;

    const payload: DomainEventContext = {
      [primaryKey]: primaryValue,
      tenantContext,
      userId: getContextValue(userIdKey) ?? systemUserId,
      timestamp: new Date().toISOString(),
      correlationId: getContextValue(correlationKey),
      modifier: this.modifier,
    } as DomainEventContext;
    return this.extendContext(payload);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  synchronize<T extends { aggregateId: string; payload: any; context: any }, V>(event: T): V {
    this.id = event.aggregateId;
    Object.assign(this, event.payload);
    this.synchronizeContext(event.context);
    return this as unknown as V;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  synchronizeContext(context: Partial<DomainEventContext> & Record<string, any>): void {
    const systemUserId = getSystemUserId();
    this.createdBy = this.createdBy ?? context.userId ?? systemUserId;
    this.createdAt = this.createdAt ?? context.timestamp ?? new Date().toISOString();
    this.updatedBy = this.updatedBy ?? context.userId ?? systemUserId;
    this.updatedAt = this.updatedAt ?? context.timestamp ?? new Date().toISOString();
  }

  #setAccess(access: DomainAccess): void {
    const auditConfig = getAuditConfig();
    const systemUserId = getSystemUserId();
    const userIdKey = auditConfig.userIdClsKey ?? auditConfig.userIdHeader ?? 'x-user-id';
    const timestamp = new Date().toISOString();

    if (DomainAccess.Create === access) {
      this.createdBy = getContextValue(userIdKey) ?? systemUserId;
      this.createdAt = timestamp;
    }

    if (DomainAccess.Update === access || DomainAccess.Create === access) {
      this.updatedBy = getContextValue(userIdKey) ?? systemUserId;
      this.updatedAt = timestamp;
    }

    if (DomainAccess.Delete === access) {
      this.deletedBy = getContextValue(userIdKey) ?? systemUserId;
      this.deletedAt = timestamp;
    }

    this.onSetAccess(access);
  }
}

export class TenantAggregateRoot<EventBase extends IEvent = IEvent> extends BasicAggregateRoot<EventBase> {
  /**
   * Dynamic tenant fields stored here.
   * For single-tenant mode with fieldName='companyId', this will hold { companyId: '...' }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  constructor(access: DomainAccess) {
    super(access);
    const levels = getHierarchyLevels();
    const systemUserId = getSystemUserId();

    for (const level of levels) {
      const clsKey = level.clsKey ?? level.headerName;
      const value = getContextValue(clsKey);
      this[level.fieldName] = value ?? systemUserId;

      // Dynamically add AggregateProp metadata for each tenant field
      const constructor = this.constructor;
      const props: Record<string, AggregatePropertyOptions | undefined> = {
        ...Reflect.getMetadata(MetadataKeys.AggregateProperties, constructor) ?? {},
        [level.fieldName]: { type: 'id' },
      };
      Reflect.defineMetadata(MetadataKeys.AggregateProperties, props, constructor);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override synchronizeContext(context: Partial<DomainEventContext> & Record<string, any>): void {
    super.synchronizeContext(context);
    const systemUserId = getSystemUserId();
    if (context.tenantContext) {
      for (const [fieldName, value] of Object.entries(context.tenantContext)) {
        this[fieldName] = value ?? systemUserId;
      }
    }
  }
}
