import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroTokenService } from './abn-amro-token.service';
import { AbnAmroApiClient } from './abn-amro-api.client';
import { AbnAmroController } from './abn-amro.controller';
import { AbnAmroAuthController } from './abn-amro-auth.controller';
import { BankConnection } from './entities/bank-connection.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    TypeOrmModule.forFeature([BankConnection]),
    TransactionsModule,
    BankAccountsModule,
    CategoriesModule,
  ],
  controllers: [AbnAmroController, AbnAmroAuthController],
  providers: [AbnAmroService, AbnAmroTokenService, AbnAmroApiClient],
})
export class AbnAmroModule {}
