import { ApiProperty } from '@nestjs/swagger';
import { Raw, TileType } from 'src/common';

export class TileSlice {
  constructor(value: Raw<TileSlice>) {
    Object.assign(this, value);
  }

  startDate: Date;
  endDate: Date;

  available: number;
  unavailable: number;
  none: number;
}

export class TileHealth {
  constructor(value: Raw<TileHealth>) {
    Object.assign(this, value);
  }

  @ApiProperty({ enum: TileType, enumName: 'TileType' })
  type: TileType;
  startDate: Date;
  endDate: Date;
  expected: number;
  actual: number;
  slices: TileSlice[];
}
