import * as dotenv from 'dotenv';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export const AppDataSourceOptions = {
  type: 'postgres' as const,
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] ? parseInt(process.env['DB_PORT']) : 5432,
  username: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'] || 'five_thirty',
  entities: [path.join(__dirname, '**', '*.entity.@(js|ts)')],
  migrations: [path.join(__dirname, 'migration', '*.js')],
  migrationsRun: process.env['NODE_ENV'] === 'production',
  synchronize: process.env['NODE_ENV'] !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
} as DataSourceOptions;

export const AppDataSource = new DataSource(AppDataSourceOptions);
