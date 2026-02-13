import { AuditableEntity, TenantAware } from '@joyb-works/nestjs-futkaey';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
@TenantAware()
export class OrderEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column('real', { default: 0 })
  total!: number;
}
