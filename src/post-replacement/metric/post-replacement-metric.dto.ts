import { Raw } from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { FindOptionsWhere } from 'typeorm';

export class PostReplacementHandledPoint {
  constructor(value: PostReplacementHandledPoint) {
    Object.assign(this, value);
  }

  date: Date;

  rejected: number;
  approved: number;
  promoted: number;
}

export class PostReplacementStatusPoint extends PostReplacementHandledPoint {
  constructor(value: PostReplacementStatusPoint) {
    super(value);
    Object.assign(this, value);
  }

  pending: number;
}

export class PostReplacementHandledQuery {
  constructor(value: Raw<PostReplacementHandledQuery>) {
    Object.assign(this, value);
  }

  userId: number;

  where(): FindOptionsWhere<PostEventEntity> {
    return { creatorId: this.userId };
  }
}
