import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum NotabilityType {
  staff = 'staff',
  reporter = 'reporter',
  uploader = 'uploader',
}

@Entity('notable_users')
export class NotableUserEntity {
  constructor(partial?: Partial<NotableUserEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'simple-enum', enum: NotabilityType })
  type: NotabilityType;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
