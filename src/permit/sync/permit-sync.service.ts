import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEventAction } from 'src/api';
import { withInvalidation } from 'src/app/browser.module';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { Repository } from 'typeorm';

import { PermitEntity } from '../permit.entity';

@Injectable()
export class PermitSyncService {
  constructor(
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.permitRepository);
  countUpdated = constructCountUpdated(this.permitRepository);

  save = withInvalidation(
    this.permitRepository.save.bind(this.permitRepository),
    PermitEntity,
  );

  remove = withInvalidation(
    this.permitRepository.remove.bind(this.permitRepository),
    PermitEntity,
  );

  delete = withInvalidation(
    this.permitRepository.delete.bind(this.permitRepository),
    PermitEntity,
  );

  /**
   * Find permits that have corresponding approvals or deletions and should be removed.
   *
   * These permits technically existed at the moment of sync, but they represent
   * an ephemeral state that cannot be reproduced. Later approvals or deletions
   * retroactively invalidate them, and any database initialized afterward would never
   * observe these permits at all.
   *
   * To keep our state reproducible and aligned with canonical history, we
   * retcon these time-sensitive entries.
   *
   * This is a direct loss of history that we accept for the sake of consistency.
   */
  async findInvalidPermits(): Promise<PermitEntity[]> {
    return this.permitRepository
      .createQueryBuilder('permit')
      .innerJoin(
        this.postEventRepository.metadata.tableName,
        'event',
        'permit.id = event.post_id AND event.action IN (:...actions)',
        {
          actions: [PostEventAction.approved, PostEventAction.deleted],
        },
      )
      .getMany();
  }
}
