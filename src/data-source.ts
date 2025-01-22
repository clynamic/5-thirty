import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const dataDir = process.env['DATA_DIR'] || './data';
const dbType = process.env['DB_TYPE'] || 'sqlite';

export const AppDataSourceOptions = {
  type: dbType as DataSourceOptions['type'],
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] ? parseInt(process.env['DB_PORT']) : undefined,
  username: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database:
    process.env['DB_NAME'] ||
    (dbType === 'sqlite' ? `${dataDir}/db.sqlite` : undefined),
  entities: ['**/*.entity.js'],
  migrations: [`src/migration/${dbType}/*.js`],
  migrationsRun: process.env['NODE_ENV'] === 'production',
  synchronize: process.env['NODE_ENV'] !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
} as DataSourceOptions;

export const AppDataSource = new DataSource(AppDataSourceOptions);
