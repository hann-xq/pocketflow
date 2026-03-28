import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [DiscoveryModule],
  providers: [SeederService],
})
export class SeederModule {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit(): Promise<void> {
    await this.seederService.run();
  }
}
