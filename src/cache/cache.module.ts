import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheService } from './cache.service';
import { CacheEntity } from './cache.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CacheEntity])],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
