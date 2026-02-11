import { AuditableEntity } from '@joyb-works/nestjs-futkaey';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lookups')
export class LookupEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  code!: string;
}
