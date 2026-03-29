import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Tag } from '../tags/entities/tag.entity';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Tag]), BankAccountsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
