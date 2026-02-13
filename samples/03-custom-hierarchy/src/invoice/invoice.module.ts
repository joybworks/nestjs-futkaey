import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './invoice.controller';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceRepository } from './invoice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity])],
  controllers: [InvoiceController],
  providers: [InvoiceRepository],
  exports: [InvoiceRepository],
})
export class InvoiceModule {}
