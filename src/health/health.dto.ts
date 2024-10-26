import { ItemType } from 'src/cache/cache.entity';
import { Raw } from 'src/common';

export enum ManifestCondition {
  nominal = 'nominal',
  degraded = 'degraded',
  abnormal = 'abnormal',
}

export class IdGap {
  constructor(value: Raw<IdGap>) {
    Object.assign(this, value);
  }

  id: number;
  nextId: number;
  gap: number;
}

export class ManifestHealth {
  constructor(value: Raw<ManifestHealth>) {
    Object.assign(this, value);
  }

  id: number;
  type: ItemType;
  startDate: Date;
  endDate: Date;
  coverage: number;
  condition: ManifestCondition;
  gaps: IdGap[];
}
