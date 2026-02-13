import { RepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { OrderEntity } from './order.entity';
import { OrderModel } from './order.model';

const Base = RepositoryMixin(OrderEntity, OrderModel);

@Injectable()
export class OrderRepository extends Base {}
