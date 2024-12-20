import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const dataDir = process.env['DATA_DIR'] || './data';

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: `${dataDir}/db.sqlite`,
  entities: ['**/*.entity.js'],
  migrations: ['src/migration/*.js'],
  migrationsRun: process.env['NODE_ENV'] === 'production',
  synchronize: process.env['NODE_ENV'] !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
};

export const AppDataSource = new DataSource(AppDataSourceOptions);
