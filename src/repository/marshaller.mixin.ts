/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, mixin, Type } from '@nestjs/common';
import { BasicAggregateRoot } from '../aggregate/aggregate-root';
import { DomainAccess } from '../aggregate/aggregate.interfaces';
import { getSystemUserId } from '../config/nestjs-futkaey.accessor';
import { IdEntity } from '../entity/id.entity';
import { newId, toDate } from './db.util';

export interface DomainEntityInterface<AppEntity extends IdEntity, AppModel extends BasicAggregateRoot> {
  toDomain(entity: AppEntity): AppModel;
  fromDomain(model: AppModel): AppEntity;
}

export const MarshallerMixin = <AppEntity extends IdEntity, AppModel extends BasicAggregateRoot>(
  tEntity: Type<AppEntity>,
  tModel: Type<AppModel>,
) => {
  @Injectable()
  class MarshallerService implements DomainEntityInterface<AppEntity, AppModel> {
    fromDomain(model: AppModel): AppEntity {
      const entity = new tEntity();
      const systemUserId = getSystemUserId();
      Object.entries(model.getAggregateProperties<AppModel>() ?? {}).forEach(([k, val]) => {
        const key = k as keyof AppModel;
        if (Object.prototype.hasOwnProperty.call(model, key) && model[key] !== undefined) {
          if (model[key] === null) {
            (entity as any)[key] = null;
            return;
          }
          switch (val?.type) {
            case 'id':
              try {
                (entity as any)[key] = newId((model[key] || systemUserId) as string);
              } catch {
                (entity as any)[key] = model[key];
              }
              break;
            case 'date':
            case 'datetime':
              (entity as any)[key] = toDate(model[key] as unknown);
              break;
            default:
              (entity as any)[key] = model[key];
              break;
          }
        }
      });
      return entity;
    }

    toDomain(entity: AppEntity): AppModel {
      const model = new tModel(DomainAccess.Read);
      const entityJson = entity.toJSON();
      const props = model.getAggregateProperties<AppModel>() ?? {};
      Object.entries(props).forEach(([k, val]) => {
        const key = k as keyof AppModel;
        if (Object.prototype.hasOwnProperty.call(entityJson, key)) {
          switch (val?.type) {
            case 'date':
            case 'datetime': {
              const value = (entityJson as any)[key];
              (model as any)[key] = value instanceof Date ? value.toISOString() : value;
              break;
            }
            default:
              (model as any)[key] = (entityJson as any)[key];
          }
        }
      });
      return model;
    }
  }
  return mixin(MarshallerService);
};
