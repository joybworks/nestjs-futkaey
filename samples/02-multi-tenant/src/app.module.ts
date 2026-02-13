import { NestjsFutkaeyModule } from '@joyb-works/nestjs-futkaey';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    NestjsFutkaeyModule.forRoot({
      tenancy: {
        mode: 'multi-tenant',
        tenant: {
          fieldName: 'companyId',
          headerName: 'x-company-id',
        },
      },
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
    OrderModule,
  ],
})
export class AppModule {}
