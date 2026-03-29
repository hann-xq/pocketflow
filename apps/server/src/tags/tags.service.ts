import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';
import { ISeeder } from '../seeds/seeder';
import { SEED_TAGS, SEED_USER } from '../seeds/seed-data';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TagsService implements ISeeder {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
    const existing = await this.tagsRepository.findOneBy({
      name: createTagDto.name,
      userId,
    });

    if (existing) {
      throw new EntityConflictException(
        `Tag "${createTagDto.name}" already exists`,
      );
    }

    const tag = this.tagsRepository.create({ ...createTagDto, userId });
    return this.tagsRepository.save(tag);
  }

  findAll(userId: string): Promise<Tag[]> {
    return this.tagsRepository.findBy({ userId });
  }

  findOne(id: string, userId: string): Promise<Tag> {
    return this.tagsRepository.findOneByOrFail({ id, userId });
  }

  async update(id: string, userId: string, data: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id, userId);

    if (data.name && data.name !== tag.name) {
      const existing = await this.tagsRepository.findOneBy({
        name: data.name,
        userId,
      });

      if (existing) {
        throw new EntityConflictException(`Tag "${data.name}" already exists`);
      }

      tag.name = data.name;
    }

    return this.tagsRepository.save(tag);
  }

  async remove(id: string, userId: string): Promise<void> {
    const tag = await this.findOne(id, userId);
    await this.tagsRepository.remove(tag);
  }

  seedPriority(): number {
    return 1; // Run after UsersService (priority 0)
  }

  async seed(): Promise<void> {
    if ((await this.tagsRepository.count()) > 0) return;

    try {
      const user = await this.usersRepository.findOneByOrFail({
        email: SEED_USER.email,
      });

      await this.tagsRepository.save(
        SEED_TAGS.map((t) =>
          this.tagsRepository.create({ ...t, userId: user.id }),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to seed tags', error);
    }
  }
}
