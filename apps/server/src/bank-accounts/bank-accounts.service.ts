import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountsRepository: Repository<BankAccount>,
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
}
