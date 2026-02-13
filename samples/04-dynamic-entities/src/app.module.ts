import { NestjsFutkaeyModule } from '@joyb-works/nestjs-futkaey';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardModule } from './card/card.module';

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
      type: 'mongodb',
      url: process.env.MONGO_URI ?? 'mongodb://localhost:27017/futkaey-sample-04',
      useUnifiedTopology: true,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CardModule,
  ],
})
export class AppModule {}
