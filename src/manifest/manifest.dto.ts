import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Raw } from 'src/common';
import { ItemType } from 'src/label/label.entity';

export class Manifest {
  constructor(value: Raw<Manifest>) {
    Object.assign(this, value);
  }

  id: number;
  startDate: Date;
  endDate: Date;
  @ApiProperty({ enum: ItemType, enumName: 'ItemType' })
  type: ItemType;
  lowerId: number;
  upperId: number;
}

export class ManifestQuery {
  constructor(value: Raw<ManifestQuery> = {}) {
    Object.assign(this, value);
  }

  @IsOptional()
  id?: number;

  @IsOptional()
  @IsArray()
  @ApiProperty({ enum: ItemType, enumName: 'ItemType' })
  type?: ItemType[];
}
