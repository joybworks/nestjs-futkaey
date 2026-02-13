import { DomainAccess } from '@joyb-works/nestjs-futkaey';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrderModel } from './order.model';
import { OrderRepository } from './order.repository';

@Controller('orders')
export class OrderController {
  constructor(private readonly repo: OrderRepository) {}

  @Post()
  async create(@Body() body: { total: number }) {
    const model = new OrderModel(DomainAccess.Create);
    model.create(body);
    return this.repo.save(model);
  }

  @Get()
  async list() {
    const { data } = await this.repo.findAndCount({});
    return data;
  }
}
