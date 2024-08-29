import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../user.entity';

@Injectable()
export class UserSyncService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

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
