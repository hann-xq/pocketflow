import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroController } from './abn-amro.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    TransactionsModule,
  ],
  controllers: [AbnAmroController],
  providers: [AbnAmroService],
})
export class AbnAmroModule {}
