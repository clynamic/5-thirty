import { FlagEntity } from 'src/flag/flag.entity';
import { Raw, toRaws } from 'src/common';
import { FindOptionsWhere } from 'typeorm';

export class DeletionCountSeriesQuery {
  constructor(value: Raw<DeletionCountSeriesQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;

  where(): FindOptionsWhere<FlagEntity> {
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

  where(): FindOptionsWhere<FlagEntity> {
    return toRaws({
      creatorId: this.creatorId,
    });
  }
}
