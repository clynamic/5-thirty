import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invalidates } from 'src/app/browser.module';
import { PostEntity } from 'src/post/post.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class AvatarSyncService {
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

  @Invalidates(PostEntity)
  async create(
    value: PostEntity | PostEntity[],
  ): Promise<PostEntity | PostEntity[]> {
    if (Array.isArray(value)) {
      return this.postRepository.save(value);
    }
    return this.postRepository.save(value);
  }
}
