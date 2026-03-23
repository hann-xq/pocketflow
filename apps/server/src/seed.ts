import * as bcrypt from 'bcrypt';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Tag } from './tags/entities/tag.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const users = app.get<Repository<User>>(getRepositoryToken(User));
  const categories = app.get<Repository<Category>>(
    getRepositoryToken(Category),
  );
  const tags = app.get<Repository<Tag>>(getRepositoryToken(Tag));

  await users
    .createQueryBuilder()
    .insert()
    .values({
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    })
    .orIgnore()
    .execute();

  await categories
    .createQueryBuilder()
    .insert()
    .values([
      { name: 'Groceries', description: 'Food and grocery shopping' },
      { name: 'Transport', description: 'Public transport, fuel, and parking' },
      { name: 'Housing', description: 'Rent, mortgage, and utilities' },
      { name: 'Entertainment', description: 'Leisure and subscriptions' },
    ])
    .orIgnore()
    .execute();

  await tags
    .createQueryBuilder()
    .insert()
    .values([
      { name: 'recurring' },
      { name: 'business' },
      { name: 'personal' },
      { name: 'refund' },
    ])
    .orIgnore()
    .execute();

  await app.close();

  console.log('🌱 Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
