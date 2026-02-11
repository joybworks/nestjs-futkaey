import {
  NestjsFutkaeyModule,
} from '@joyb-works/nestjs-futkaey';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupModule } from './lookup/lookup.module';

@Module({
  imports: [
    NestjsFutkaeyModule.forRoot({
      tenancy: { mode: 'regular' },
      audit: {
        userIdHeader: 'x-user-id',
        correlationIdHeader: 'x-correlation-id',
        enableSoftDelete: true,
      },
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    LookupModule,
  ],
})
export class AppModule { }
