import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { BankAccount } from '../../bank-accounts/entities/bank-account.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('transactions')
@Unique(['bankAccountId', 'externalId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Optional identifier from the originating bank system.
   *
   * Combined with bankAccountId in a unique constraint to prevent duplicates.
   *
   * Null for manually created transactions.
   */
  @Column({ nullable: true, type: 'varchar' })
  @Exclude()
  externalId: string | null;

  @Expose()
  get isExternal(): boolean {
    return this.externalId !== null;
  }

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true, type: 'varchar' })
  counterpartyName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  counterpartyAccount: string | null;

  @ManyToOne(() => Category, (category) => category.transactions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => BankAccount, (bankAccount) => bankAccount.transactions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccount;

  @Column({ name: 'bank_account_id' })
  bankAccountId: string;

  @ManyToMany(() => Tag, (tag) => tag.transactions, { cascade: true })
  @JoinTable({
    joinColumn: { name: 'transaction_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
