import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';
import { ISeeder } from '../seeds/seeder';
import { User } from '../users/entities/user.entity';
import { SEED_BANK_ACCOUNT, SEED_USER } from '../seeds/seed-data';

@Injectable()
export class BankAccountsService implements ISeeder {
  private readonly logger = new Logger(BankAccountsService.name);

  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountsRepository: Repository<BankAccount>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateBankAccountDto): Promise<BankAccount> {
    const existing = await this.bankAccountsRepository.findOneBy({
      accountNumber: dto.accountNumber,
    });

    if (existing) {
      throw new EntityConflictException(
        `Bank account with account number "${dto.accountNumber}" already exists`,
      );
    }

    const bankAccount = this.bankAccountsRepository.create(dto);
    return this.bankAccountsRepository.save(bankAccount);
  }

  findAllForUser(userId: string): Promise<BankAccount[]> {
    return this.bankAccountsRepository.findBy({ userId });
  }

  findOne(id: string): Promise<BankAccount> {
    return this.bankAccountsRepository.findOneByOrFail({ id });
  }

  async update(id: string, dto: UpdateBankAccountDto): Promise<BankAccount> {
    const bankAccount = await this.findOne(id);

    bankAccount.accountName = dto.accountName ?? bankAccount.accountName;

    return this.bankAccountsRepository.save(bankAccount);
  }

  async findOrCreateByAccountNumber(
    accountNumber: string,
    userId: string,
  ): Promise<BankAccount> {
    const existing = await this.bankAccountsRepository.findOneBy({
      accountNumber,
    });

    if (existing) {
      return existing;
    }

    const bankAccount = this.bankAccountsRepository.create({
      accountNumber,
      accountName: accountNumber,
      userId,
    });

    return this.bankAccountsRepository.save(bankAccount);
  }

  async remove(id: string): Promise<void> {
    const bankAccount = await this.findOne(id);
    await this.bankAccountsRepository.remove(bankAccount);
  }

  seedPriority(): number {
    return 1; // Run after UsersService (priority 0)
  }

  async seed(): Promise<void> {
    if ((await this.bankAccountsRepository.count()) > 0) return;

    try {
      const user = await this.usersRepository.findOneByOrFail({
        email: SEED_USER.email,
      });

      await this.bankAccountsRepository.save(
        this.bankAccountsRepository.create({
          accountNumber: SEED_BANK_ACCOUNT.accountNumber,
          accountName: SEED_BANK_ACCOUNT.accountName,
          userId: user.id,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to seed bank accounts', error);
    }
  }
}
