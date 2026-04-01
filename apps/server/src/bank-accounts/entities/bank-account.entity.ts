import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { BankConnection } from '../../abn-amro/entities/bank-connection.entity';
import { ExternalConnectionType } from '../enums/external-connection-type.enum';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accountNumber: string;

  @Column()
  accountName: string;

  @OneToMany(() => Transaction, (transaction) => transaction.bankAccount)
  transactions: Transaction[];

  @ManyToOne(() => User, (user) => user.bankAccounts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Exclude()
  @OneToOne(() => BankConnection, (account) => account.bankAccount)
  bankConnection?: BankConnection;

  @Expose()
  get connectionType(): ExternalConnectionType | null {
    return this.bankConnection?.type ?? null;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
