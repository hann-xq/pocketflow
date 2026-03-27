import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AbnAmroModule } from './abn-amro/abn-amro.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { ValidatorsModule } from './validators/validators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'pocketflow'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    CategoriesModule,
    TagsModule,
    TransactionsModule,
    AbnAmroModule,
    BankAccountsModule,
    ValidatorsModule,
  ],
})
export class AppModule {}
