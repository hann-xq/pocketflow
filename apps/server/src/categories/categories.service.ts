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

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  findOne(id: string): Promise<Category> {
    return this.categoriesRepository.findOneByOrFail({ id });
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
    if ((await this.categoriesRepository.count()) > 0) return;

    await this.categoriesRepository.save(
      SEED_CATEGORIES.map((c) => this.categoriesRepository.create(c)),
    );
  }
}
