import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { subMilliseconds } from 'date-fns';
import { postsMany, usersMany } from 'src/api';
import { AuthService } from 'src/auth/auth.service';
import { convertKeysToCamelCase } from 'src/common';
import { PostEntity } from 'src/post/post.entity';
import { In, IsNull, MoreThan, Not, Repository } from 'typeorm';

import { UserEntity, UserLabelEntity } from '../user.entity';
import { UserHead } from './user-head.dto';

export interface UserHeadParams {
  fetchMissing?: boolean;
  staleness?: number;
}

@Injectable()
export class UserHeadService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly authService: AuthService,
  ) {}

  get(id: number, params?: UserHeadParams): Promise<UserHead>;
  get(id: number[], params?: UserHeadParams): Promise<UserHead[]>;

  async get(
    id: number | number[],
    params?: UserHeadParams,
  ): Promise<UserHead | UserHead[]> {
    const isArray = Array.isArray(id);
    const ids = isArray ? id : [id];

    const users = await this.userRepository.find({
      where: {
        id: In(ids),
        label: params?.staleness
          ? {
              refreshedAt: MoreThan(
                subMilliseconds(new Date(), params.staleness),
              ),
            }
          : undefined,
      },
      select: ['id', 'name', 'avatarId', 'levelString'],
      relations: ['label'],
    });

    if (params?.fetchMissing) {
      const missing = ids.filter((id) => !users.some((user) => user.id === id));

      if (missing.length > 0) {
        const fetched = await usersMany(
          missing,
          this.authService.getServerAxiosConfig(),
        );

        const rest = await this.userRepository.save(
          fetched.map(
            (user) =>
              new UserEntity({
                ...convertKeysToCamelCase(user),
                label: new UserLabelEntity(user),
              }),
          ),
        );

        users.push(...rest);
      }
    }

    const avatarIds = users
      .filter((user) => user.avatarId)
      .map((user) => user.avatarId);

    const avatars = await this.postRepository.find({
      where: {
        id: In(avatarIds),
        preview: Not(IsNull()),
        deleted: false,
      },
      select: ['id', 'preview'],
    });

    if (params?.fetchMissing) {
      const missing = avatarIds.filter(
        (id): id is number =>
          id !== null && !avatars.some((avatar) => avatar.id === id),
      );

      if (missing.length > 0) {
        const fetched = await postsMany(
          missing,
          this.authService.getServerAxiosConfig(),
        );

        const rest = await this.postRepository.save(
          fetched.map((post) => PostEntity.fromPost(post)),
        );

        avatars.push(
          ...rest.filter((post) => !post.deleted && post.preview !== null),
        );
      }
    }

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
