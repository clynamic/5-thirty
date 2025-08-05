import { Raw, toRaws } from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { FindOptionsWhere } from 'typeorm';

export class DeletionCountSeriesQuery {
  constructor(value: Raw<DeletionCountSeriesQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;

  where(): FindOptionsWhere<PostEventEntity> {
    return toRaws({
      creatorId: this.creatorId,
    });
  }
}

export class DeletionActivitySummaryQuery {
  constructor(value: Raw<DeletionActivitySummaryQuery>) {
    Object.assign(this, value);
  }

  creatorId: number;

  where(): FindOptionsWhere<PostEventEntity> {
    return toRaws({
      creatorId: this.creatorId,
    });
  }
}
