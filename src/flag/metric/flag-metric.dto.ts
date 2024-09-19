import { Raw } from 'src/utils';
import { FindOptionsWhere } from 'typeorm';

import { FlagEntity } from '../flag.entity';

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
