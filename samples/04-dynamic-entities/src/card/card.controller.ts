import { DomainAccess } from '@joyb-works/nestjs-futkaey';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { CardModel } from './card.model';
import { CardRepository } from './card.repository';
import { TransactionModel } from './transaction.model';
import { TransactionRepository } from './transaction.repository';

@Controller('cards')
export class CardController {
  constructor(
    private readonly cardRepo: CardRepository,
    private readonly transactionRepo: TransactionRepository,
  ) {}

  @Post()
  async createCard(@Body() body: { lastFour: string }) {
    const model = new CardModel(DomainAccess.Create);
    model.create(body);
    return this.cardRepo.save(model);
  }

  @Get()
  async listCards() {
    const { data } = await this.cardRepo.findAndCount({});
    return data;
  }

  @Get(':cardId')
  async getCard(@Param('cardId') cardId: string) {
    return this.cardRepo.findOneById(new ObjectId(cardId));
  }

  @Post(':cardId/transactions')
  async addTransaction(
    @Param('cardId') cardId: string,
    @Body() body: { amount: number; merchant: string },
  ) {
    const creditcardId = new ObjectId(cardId);
    const model = new TransactionModel(DomainAccess.Create);
    model.create({ creditcardId, amount: body.amount, merchant: body.merchant });
    return this.transactionRepo.save(model);
  }

  @Get(':cardId/transactions')
  async listTransactions(@Param('cardId') cardId: string) {
    const { data } = await this.transactionRepo.findAndCount({
      where: { creditcardId: new ObjectId(cardId) },
    });
    return data;
  }
}
