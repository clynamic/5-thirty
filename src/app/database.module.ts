import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSourceOptions } from 'src/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSourceOptions)],
})
export class DatabaseModule {}
