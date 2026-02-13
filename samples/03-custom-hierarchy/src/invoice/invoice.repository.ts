import { RepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceModel } from './invoice.model';

const Base = RepositoryMixin(InvoiceEntity, InvoiceModel);

@Injectable()
export class InvoiceRepository extends Base {}
