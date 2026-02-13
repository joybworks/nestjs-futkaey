import { DynamicRepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { TransactionEntity } from './transaction.entity';
import { TransactionModel } from './transaction.model';

const Base = DynamicRepositoryMixin(TransactionEntity, TransactionModel);

@Injectable()
export class TransactionRepository extends Base {}
