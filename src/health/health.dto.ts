import { ItemType } from 'src/cache/cache.entity';
import { Raw } from 'src/common';

export class ManifestSlice {
  constructor(value: Raw<ManifestSlice>) {
    Object.assign(this, value);
  }

  startId: number;
  endId: number;

  available: number;
  unavailable: number;
  none: number;
}

export class ManifestHealth {
  constructor(value: Raw<ManifestHealth>) {
    Object.assign(this, value);
  }

  id: number;
  type: ItemType;
  startDate: Date;
  endDate: Date;
  startId: number;
  endId: number;
  count: number;
  slices: ManifestSlice[];
}
