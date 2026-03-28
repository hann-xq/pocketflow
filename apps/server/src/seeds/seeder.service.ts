import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { ISeeder } from './seeder';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Execute the seed method of services implementing the seeder interface.
   */
  async run() {
    const seeders: ISeeder[] = [];

    for (const provider of this.discoveryService.getProviders()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { instance } = provider;

      // The provider is only a reference, an incomplete object, or a primitive value.
      if (
        !instance ||
        typeof instance !== 'object' ||
        !Object.getPrototypeOf(instance)
      ) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (Reflect.has(instance, 'seed')) {
        seeders.push(instance as ISeeder);
      }
    }

    if (seeders.length === 0) {
      this.logger.warn('No seeders found, skipping.');
      return;
    }

    // Sort the seeders in ascending order (from the lowest to the highest priority).
    seeders.sort((a, b) => a.seedPriority() - b.seedPriority());

    this.logger.log(`Running ${seeders.length} seeder(s)...`);

    // Execute the seeders one by one, always waiting for the previous one to finish.
    for (const seeder of seeders) {
      this.logger.verbose(`Seeding ${seeder.constructor.name}...`);

      try {
        await seeder.seed();
      } catch (error) {
        this.logger.error(`Failed to seed ${seeder.constructor.name}`, error);
      }
    }

    this.logger.log('All seeders completed.');
  }
}
