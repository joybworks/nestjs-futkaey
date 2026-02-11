import { DomainAccess } from '@joyb-works/nestjs-futkaey';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { LookupModel } from './lookup.model';
import { LookupRepository } from './lookup.repository';

@Controller('lookup')
export class LookupController {
  constructor(private readonly repo: LookupRepository) { }

  @Post()
  async create(@Body() body: { name: string; code: string }) {
    const model = new LookupModel(DomainAccess.Create);
    model.create(body);
    return this.repo.save(model);
  }

  @Get()
  async list() {
    const { data } = await this.repo.findAndCount({});
    return data;
  }
}
