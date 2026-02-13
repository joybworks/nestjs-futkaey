import { NestjsFutkaeyModule } from '@joyb-works/nestjs-futkaey';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    NestjsFutkaeyModule.forRoot({
      tenancy: {
        mode: 'custom-hierarchy',
        hierarchy: [
          { fieldName: 'tenantId', headerName: 'x-tenant-id' },
          { fieldName: 'companyId', headerName: 'x-company-id' },
          { fieldName: 'customerId', headerName: 'x-customer-id' },
        ],
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
    InvoiceModule,
  ],
})
export class AppModule {}
