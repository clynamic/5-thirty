import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { UserEntity } from '../user.entity';
import { NotableUserQuery } from './notable-user.dto';
import { NotableUserEntity } from './notable-user.entity';

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

  note(value: NotableUserEntity): Promise<NotableUserEntity>;
  note(value: NotableUserEntity[]): Promise<NotableUserEntity[]>;

  async note(
    value: NotableUserEntity | NotableUserEntity[],
  ): Promise<NotableUserEntity | NotableUserEntity[]> {
    if (Array.isArray(value)) {
      return this.notableUserRepository.save(value);
    }
    return this.notableUserRepository.save(value);
  }

  denote(value: NotableUserEntity): Promise<void>;
  denote(value: NotableUserEntity[]): Promise<void>;

  async denote(value: NotableUserEntity | NotableUserEntity[]): Promise<void> {
    if (Array.isArray(value)) {
      await this.notableUserRepository.remove(value);
    } else {
      await this.notableUserRepository.remove(value);
    }
  }

  create(value: UserEntity): Promise<UserEntity>;
  create(value: UserEntity[]): Promise<UserEntity[]>;

  async create(
    value: UserEntity | UserEntity[],
  ): Promise<UserEntity | UserEntity[]> {
    if (Array.isArray(value)) {
      return this.userRepository.save(value);
    }
    return this.userRepository.save(value);
  }
}
