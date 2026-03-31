import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from '../../bank-accounts/entities/bank-account.entity';
import { encryptedColumnTransformer } from '../../encryption/encrypted-column.transformer';
import { ExternalConnectionType } from '../../bank-accounts/enums/external-connection-type.enum';

/**
 * Stores OAuth2 tokens for a bank account connected to an external provider.
 * Both token columns are encrypted at rest via encryptedColumnTransformer.
 */
@Entity('bank_connections')
export class BankConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => BankAccount, (account) => account.bankConnection, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccount;

  @Column({ name: 'bank_account_id', unique: true })
  bankAccountId: string;

  @Column({ type: 'varchar', default: ExternalConnectionType.AbnAmro })
  type: ExternalConnectionType;

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
