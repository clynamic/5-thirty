import { Raw } from 'src/utils';
import { FindOptionsWhere } from 'typeorm';

import { FlagEntity } from '../flag.entity';

export class PostDeletedActivityUserQuery {
  constructor(value: Raw<PostDeletedActivityUserQuery>) {
    Object.assign(this, value);
  }

  creatorId: number;

  where(): FindOptionsWhere<FlagEntity> {
    return {
      creatorId: this.creatorId,
    };
  }
}

export class PostDeletedActivityPoint {
  constructor(value: PostDeletedActivityPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class PostDeletedUserQuery {
  constructor(value: Raw<PostDeletedUserQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;

  where(): FindOptionsWhere<FlagEntity> {
    return {
      ...(this.creatorId && { creatorId: this.creatorId }),
    };
  }
}

export class PostDeletedPoint {
  constructor(value: PostDeletedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}
