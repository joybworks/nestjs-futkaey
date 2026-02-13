import { AuditableEntity, TenantAware } from '@joyb-works/nestjs-futkaey';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invoices')
@TenantAware()
export class InvoiceEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  companyId!: string;

  @Column({ nullable: true })
  customerId!: string | null;

  @Column('real', { default: 0 })
  amount!: number;
}
