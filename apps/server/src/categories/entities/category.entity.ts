import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CategoryType } from '../enums/category-type.enum';

@Entity('categories')
@Unique(['name', 'type'])
@Unique(['slug', 'type'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  slug: string | null;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ type: 'varchar' })
  type: CategoryType;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
