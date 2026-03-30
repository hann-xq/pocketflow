import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  slug: string | null;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
