import { ApiProperty } from '@nestjs/swagger';
import { Raw } from 'src/common';
import { ItemType } from 'src/label/label.entity';

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
  @ApiProperty({ enum: ItemType, enumName: 'ItemType' })
  type: ItemType;
  porous: boolean;
  startDate: Date;
  endDate: Date;
  startId: number;
  endId: number;
  count: number;
  slices: ManifestSlice[];
}
