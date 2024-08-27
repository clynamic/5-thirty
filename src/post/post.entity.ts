import { PostRating, Tags } from 'src/api/e621';
import { CacheLink } from 'src/cache';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('posts')
export class PostEntity extends CacheLink {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'date' })
  updatedAt: Date;

  @Column({ type: 'text' })
  file: string;

  @Column({ type: 'text' })
  previewUrl: string;

  @Column({ type: 'text' })
  sampleUrl: string;

  @Column({ type: 'text' })
  extension: string;

  @Column({ type: 'text', enum: PostRating })
  rating: PostRating;

  @Column({ type: 'int' })
  favorites: number;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  uploaderId: number;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'json' })
  tags: Tags;

  @Column({ type: 'boolean' })
  deleted: boolean;
}
