import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';
import { ISeeder } from '../seeds/seeder';
import { SEED_TAGS } from '../seeds/seed-data';

@Injectable()
export class TagsService implements ISeeder {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagsRepository.findOneBy({
      name: createTagDto.name,
    });

    if (existing) {
      throw new EntityConflictException(
        `Tag "${createTagDto.name}" already exists`,
      );
    }

    const tag = this.tagsRepository.create(createTagDto);
    return this.tagsRepository.save(tag);
  }

  findAll(): Promise<Tag[]> {
    return this.tagsRepository.find();
  }

  findOne(id: string): Promise<Tag> {
    return this.tagsRepository.findOneByOrFail({ id });
  }

  async update(id: string, data: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    if (data.name) {
      tag.name = data.name;
    }

    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagsRepository.remove(tag);
  }

  seedPriority(): number {
    return 0;
  }

  async seed(): Promise<void> {
    if ((await this.tagsRepository.count()) > 0) return;

    await this.tagsRepository.save(
      SEED_TAGS.map((t) => this.tagsRepository.create(t)),
    );
  }
}
