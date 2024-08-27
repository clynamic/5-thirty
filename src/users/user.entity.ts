import { CacheLink } from 'src/cache';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserEntity extends CacheLink {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  level: string;

  @Column({ type: 'int' })
  avatarId: number | null;

  @Column({ type: 'text' })
  aboutInfo: string;

  @Column({ type: 'text' })
  comissionInfo: string;
}
