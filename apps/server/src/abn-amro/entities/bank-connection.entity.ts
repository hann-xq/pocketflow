import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from '../../bank-accounts/entities/bank-account.entity';
import { encryptedColumnTransformer } from '../../encryption/encrypted-column.transformer';

/**
 * Stores the ABN AMRO OAuth2 tokens for a specific bank account.
 * Both token columns are encrypted at rest via encryptedColumnTransformer.
 */
@Entity('bank_connections')
export class BankConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BankAccount, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccount;

  @Column({ name: 'bank_account_id', unique: true })
  bankAccountId: string;

  @Column({
    name: 'access_token',
    type: 'varchar',
    length: 2000,
    transformer: encryptedColumnTransformer,
  })
  accessToken: string;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 2000,
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  refreshToken: string | null;

  @Column({ name: 'expires_at' })
  expiresAt: Date;
}
