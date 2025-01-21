import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { DefaultColumn, MetaColumn } from './meta-column';

export const DateTimeColumn = MetaColumn(DefaultColumn, (dataSource) => {
  const isSQLite = dataSource.options.type === 'sqlite';
  return {
    type: isSQLite ? 'datetime' : 'timestamp',
  };
});

export const CreateDateTimeColumn = MetaColumn(
  CreateDateColumn,
  (dataSource) => {
    const isSQLite = dataSource.options.type === 'sqlite';
    return {
      type: isSQLite ? 'datetime' : 'timestamp',
    };
  },
);

export const UpdateDateTimeColumn = MetaColumn(
  UpdateDateColumn,
  (dataSource) => {
    const isSQLite = dataSource.options.type === 'sqlite';
    return {
      type: isSQLite ? 'datetime' : 'timestamp',
    };
  },
);
