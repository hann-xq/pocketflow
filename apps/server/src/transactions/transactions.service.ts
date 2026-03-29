import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    bankAccountId: string,
  ): Promise<Transaction> {
    const { tagIds, ...transactionData } = createTransactionDto;

    const transaction = this.transactionsRepository.create({
      ...transactionData,
      bankAccountId,
    });

    if (tagIds && tagIds.length > 0) {
      transaction.tags = await this.tagsRepository.findBy({ id: In(tagIds) });
    } else {
      transaction.tags = [];
    }

    const saved = await this.transactionsRepository.save(transaction);
    return this.findOne(saved.id);
  }

  findAllForUser(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { bankAccount: { userId } },
      relations: ['category', 'tags', 'bankAccount'],
    });
  }

  findOne(id: string): Promise<Transaction> {
    return this.transactionsRepository.findOneOrFail({
      where: { id },
      relations: ['category', 'tags', 'bankAccount'],
    });
  }

  async update(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOneByOrFail({
      id,
    });

    if (data.description !== undefined) {
      transaction.description = data.description;
    }

    if (data.amount !== undefined) {
      transaction.amount = data.amount;
    }

    if (data.date !== undefined) {
      transaction.date = data.date;
    }

    if (data.counterpartyName !== undefined) {
      transaction.counterpartyName = data.counterpartyName;
    }

    if (data.counterpartyAccount !== undefined) {
      transaction.counterpartyAccount = data.counterpartyAccount;
    }

    if (data.categoryId !== undefined) {
      transaction.categoryId = data.categoryId;
    }

    if (data.tagIds !== undefined) {
      const tags = data.tagIds;

      transaction.tags =
        tags.length > 0
          ? await this.tagsRepository.findBy({ id: In(data.tagIds) })
          : [];
    }

    await this.transactionsRepository.save(transaction);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionsRepository.remove(transaction);
  }

  async bulkCreate(
    transactions: Partial<Transaction>[],
  ): Promise<Transaction[]> {
    return this.transactionsRepository.save(
      this.transactionsRepository.create(transactions),
    );
  }
}
