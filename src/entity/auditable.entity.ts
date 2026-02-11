/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { IdEntity } from './id.entity';

/**
 * Adds audit trail fields to an entity.
 * Extends IdEntity with createdBy/At, updatedBy/At, deletedBy/At.
 *
 * Users extend this for non-tenant-aware entities.
 * For tenant-aware entities, extend this AND apply @TenantAware() decorator.
 */
export abstract class AuditableEntity extends IdEntity {
  @Column()
  public createdBy!: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  public createdAt!: Date;

  @Column()
  public updatedBy!: any;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  public updatedAt!: Date;

  @Column({ nullable: true })
  public deletedBy?: any | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  public deletedAt?: Date | null;
}
