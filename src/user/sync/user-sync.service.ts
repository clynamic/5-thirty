import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { subMilliseconds } from 'date-fns';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { withInvalidation } from 'src/app/browser.module';

import { NotableUserEntity } from '../notable-user.entity';
import { UserEntity } from '../user.entity';
import { NotableUserQuery } from './user-sync.dto';

@Injectable()
export class UserSyncService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(NotableUserEntity)
    private readonly notableUserRepository: Repository<NotableUserEntity>,
  ) {}

  async listNotable(query?: NotableUserQuery) {
    return this.notableUserRepository.find({
      where: {
        id: query?.id,
        type: query?.type ? In(query.type) : undefined,
        updatedAt: query?.newerThan
          ? MoreThanOrEqual(query.newerThan)
          : undefined,
      },
    });
  }

  async listNotableAvatars(query?: NotableUserQuery): Promise<number[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(NotableUserEntity, 'notable_user', 'user.id = notable_user.id')
      .andWhere('user.avatar_id IS NOT NULL')
      .select(['user.id', 'user.avatar_id']);

    if (query?.type && query.type.length > 0) {
      queryBuilder.andWhere('notable_user.type IN (:...types)', {
        types: query.type,
      });
    }

    if (query?.newerThan) {
      queryBuilder.andWhere('notable_user.updated_at >= :updatedAt', {
        updatedAt: query.newerThan,
      });
    }

    return queryBuilder
      .getRawMany<{
        id: number;
        avatar_id: number;
      }>()
      .then((users) => users.map((user) => user.avatar_id));
  }

  note = withInvalidation(
    this.notableUserRepository.save.bind(this.notableUserRepository),
    NotableUserEntity,
  );

  denote = withInvalidation(
    this.notableUserRepository.remove.bind(this.notableUserRepository),
    NotableUserEntity,
  );

  create = withInvalidation(
    this.userRepository.save.bind(this.userRepository),
    UserEntity,
  );

  async findOutdated(
    users: number[],
    staleness: number = 60 * 60 * 1000,
  ): Promise<number[]> {
    return this.userRepository
      .find({
        where: {
          id: In(users),
          label: {
            refreshedAt: MoreThanOrEqual(
              subMilliseconds(new Date(), staleness),
            ),
          },
        },
        select: ['id'],
        relations: ['label'],
      })
      .then((ids) => users.filter((id) => !ids.some((user) => user.id === id)));
  }
}
