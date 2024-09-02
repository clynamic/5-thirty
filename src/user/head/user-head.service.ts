import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/post.entity';
import { In, IsNull, Not, Repository } from 'typeorm';

import { UserEntity } from '../user.entity';
import { UserHead } from './user-head.dto';

@Injectable()
export class UserHeadService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  get(id: number): Promise<UserHead>;
  get(id: number[]): Promise<UserHead[]>;

  async get(id: number | number[]): Promise<UserHead | UserHead[]> {
    const isArray = Array.isArray(id);
    const ids = isArray ? id : [id];

    const users = await this.userRepository.find({
      where: { id: In(ids) },
      select: ['id', 'name', 'avatarId', 'levelString'],
    });

    const avatarIds = users
      .filter((user) => user.avatarId)
      .map((user) => user.avatarId);

    const avatars = await this.postRepository.find({
      where: {
        id: In(avatarIds),
        preview: Not(IsNull()),
      },
      select: ['id', 'preview'],
    });

    const result = users.map(
      (user) =>
        new UserHead({
          id: user.id,
          name: user.name,
          avatar:
            avatars.find((avatar) => avatar.id === user.avatarId)?.preview ??
            undefined,
          level: user.levelString,
        }),
    );

    if (isArray) {
      return result;
    } else {
      if (result.length === 0) {
        throw new NotFoundException("User doesn't exist");
      }
      return result[0]!;
    }
  }
}
