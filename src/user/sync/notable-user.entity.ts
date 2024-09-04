import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum NotabilityType {
  staff = 'staff',
  reporter = 'reporter',
}

@Entity('notable_users')
export class NotableUserEntity {
  constructor(partial?: Partial<NotableUserEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'simple-enum', enum: NotabilityType })
  type: NotabilityType;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}