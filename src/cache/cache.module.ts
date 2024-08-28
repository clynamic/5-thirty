import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheEntity } from './cache.entity';
import { CacheService } from './cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([CacheEntity])],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
