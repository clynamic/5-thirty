import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: 'db.sqlite',
  entities: ['**/*.entity.js'],
  migrations: ['src/migration/*.js'],
  migrationsRun: process.env['NODE_ENV'] === 'production',
  synchronize: process.env['NODE_ENV'] !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
};

export const AppDataSource = new DataSource(AppDataSourceOptions);
