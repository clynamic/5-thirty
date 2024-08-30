import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { PostEntity } from '../post.entity';

@Injectable()
export class PostSyncService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async findNotStored(ids: number[]): Promise<number[]> {
    const storedIds = await this.postRepository.find({
      where: { id: In(ids) },
      select: ['id'],
    });

    return ids.filter((id) => !storedIds.some((post) => post.id === id));
  }

  create(value: PostEntity): Promise<PostEntity>;
  create(value: PostEntity[]): Promise<PostEntity[]>;

  async create(
    value: PostEntity | PostEntity[],
  ): Promise<PostEntity | PostEntity[]> {
    if (Array.isArray(value)) {
      return this.postRepository.save(value);
    }
    return this.postRepository.save(value);
  }
}
