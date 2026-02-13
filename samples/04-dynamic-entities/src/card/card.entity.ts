import { AuditableEntity, TenantAware } from '@joyb-works/nestjs-futkaey';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('cards')
@TenantAware()
export class CardEntity extends AuditableEntity {
  @ObjectIdColumn({ name: '_id' })
  id!: ObjectId;

  @Column()
  companyId!: ObjectId;

  @Column()
  lastFour!: string;
}
