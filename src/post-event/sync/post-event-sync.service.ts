import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { withInvalidation } from 'src/app/browser.module';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { PostEventEntity } from '../post-event.entity';

@Injectable()
export class PostEventSyncService {
  constructor(
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.postEventRepository);
  countUpdated = constructCountUpdated(this.postEventRepository);

  save = withInvalidation(
    this.postEventRepository.save.bind(this.postEventRepository),
    PostEventEntity,
  );
}
