import { CreateDateColumn, DataSource, UpdateDateColumn } from 'typeorm';

import { DefaultColumn, MetaColumn } from './meta-column';

const resolveDatetimeColumnForDataSource = (dataSource: DataSource) => {
  switch (dataSource.options.type) {
    case 'sqlite':
      return 'datetime';
    case 'postgres':
      return 'timestamptz';
    default:
      throw new Error('Unsupported database type');
  }
};

export const DateTimeColumn = MetaColumn(DefaultColumn, (dataSource) => {
  return {
    type: resolveDatetimeColumnForDataSource(dataSource),
  };
});

export const CreateDateTimeColumn = MetaColumn(
  CreateDateColumn,
  (dataSource) => {
    return {
      type: resolveDatetimeColumnForDataSource(dataSource),
    };
  },
);

export const UpdateDateTimeColumn = MetaColumn(
  UpdateDateColumn,
  (dataSource) => {
    return {
      type: resolveDatetimeColumnForDataSource(dataSource),
    };
  },
);
