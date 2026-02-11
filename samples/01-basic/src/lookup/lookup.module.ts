import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupEntity } from './lookup.entity';
import { LookupRepository } from './lookup.repository';
import { LookupController } from './lookup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LookupEntity])],
  controllers: [LookupController],
  providers: [LookupRepository],
  exports: [LookupRepository],
})
export class LookupModule {}
