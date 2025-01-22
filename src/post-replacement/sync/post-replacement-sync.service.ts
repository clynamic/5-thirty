import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { PostReplacementEntity } from '../post-replacement.entity';

@Injectable()
export class PostReplacementSyncService {
  constructor(
    @InjectRepository(PostReplacementEntity)
    private readonly postReplacementRepository: Repository<PostReplacementEntity>,
  ) {}

  save = this.postReplacementRepository.save.bind(
    this.postReplacementRepository,
  );

  firstFromId = constructFirstFromId(this.postReplacementRepository);
  countUpdated = constructCountUpdated(this.postReplacementRepository);
}
