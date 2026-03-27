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
  ): Promise<Transaction> {
    const { tagIds, ...transactionData } = createTransactionDto;

    const transaction = this.transactionsRepository.create(transactionData);

    if (tagIds && tagIds.length > 0) {
      transaction.tags = await this.tagsRepository.findBy({ id: In(tagIds) });
    } else {
      transaction.tags = [];
    }

    return this.transactionsRepository.save(transaction);
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

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);
    const { tagIds, ...transactionData } = updateTransactionDto;

    Object.assign(transaction, transactionData);

    if (tagIds !== undefined) {
      transaction.tags =
        tagIds.length > 0
          ? await this.tagsRepository.findBy({ id: In(tagIds) })
          : [];
    }

    return this.transactionsRepository.save(transaction);
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
