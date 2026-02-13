import { DomainAccess } from '@joyb-works/nestjs-futkaey';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { InvoiceModel } from './invoice.model';
import { InvoiceRepository } from './invoice.repository';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly repo: InvoiceRepository) {}

  @Post()
  async create(@Body() body: { amount: number }) {
    const model = new InvoiceModel(DomainAccess.Create);
    model.create(body);
    return this.repo.save(model);
  }

  @Get()
  async list() {
    const { data } = await this.repo.findAndCount({});
    return data;
  }
}
