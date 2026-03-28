import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityConflictException } from '../common/exceptions/conflict.exception';
import { ISeeder } from '../seeds/seeder';
import { SEED_USER } from '../seeds/seed-data';

@Injectable()
export class UsersService implements ISeeder {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });

    if (existing) {
      throw new EntityConflictException(
        `User with email "${createUserDto.email}" already exists`,
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOneByOrFail({ id });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (data.email) {
      const existing = await this.usersRepository.findOneBy({
        email: data.email,
      });

      if (existing && existing.id !== user.id) {
        throw new EntityConflictException(
          `User with email "${data.email}" already exists`,
        );
      }

      user.email = data.email;
    }

    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  seedPriority(): number {
    return 0;
  }

  async seed(): Promise<void> {
    if ((await this.usersRepository.count()) > 0) return;

    await this.usersRepository.save(
      this.usersRepository.create({
        email: SEED_USER.email,
        password: await bcrypt.hash(SEED_USER.password, 10),
      }),
    );
  }
}
