import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';
import { ISeeder } from '../seeds/seeder';
import { SEED_CATEGORIES } from '../seeds/seed-data';

@Injectable()
export class CategoriesService implements ISeeder {
  public static readonly UNCATEGORIZED_SLUG = 'uncategorized';

  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findOneBy({
      name: createCategoryDto.name,
    });

    if (existing) {
      throw new EntityConflictException(
        `Category "${createCategoryDto.name}" already exists`,
      );
    }

    return this.categoriesRepository.save(
      this.categoriesRepository.create({
        ...createCategoryDto,
        slug: null,
      }),
    );
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  findOne(id: string): Promise<Category> {
    return this.categoriesRepository.findOneByOrFail({ id });
  }

  findBySlug(slug: string): Promise<Category> {
    return this.categoriesRepository.findOneByOrFail({ slug });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  seedPriority(): number {
    return 0;
  }

  async seed(): Promise<void> {
    // Upsert by slug so that required system categories (e.g., uncategorized)
    // are always present, even when the database already has other categories.
    await this.categoriesRepository.upsert(
      SEED_CATEGORIES.map((c) => this.categoriesRepository.create(c)),
      ['slug'],
    );
  }
}
