import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardController } from './card.controller';
import { CardEntity } from './card.entity';
import { CardRepository } from './card.repository';
import { TransactionEntity } from './transaction.entity';
import { TransactionRepository } from './transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardEntity, TransactionEntity]),
  ],
  controllers: [CardController],
  providers: [CardRepository, TransactionRepository],
  exports: [CardRepository, TransactionRepository],
})
export class CardModule {}
