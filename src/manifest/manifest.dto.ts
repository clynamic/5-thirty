import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { ConvertKeysToCamelCase, Raw } from 'src/common';
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

export class ManifestAvailableQuery {
  constructor(value: Raw<ManifestAvailableQuery> = {}) {
    Object.assign(this, value);
  }

  @IsOptional()
  @IsArray()
  @ApiProperty({ enum: ItemType, enumName: 'ItemType' })
  type?: ItemType[];
}

export class ManifestAvailability
  implements ConvertKeysToCamelCase<Partial<Record<ItemType, number>>>
{
  constructor(value: Raw<ManifestAvailability>) {
    Object.assign(this, value);
  }

  approvals?: number;
  tickets?: number;
  posts?: number;
  users?: number;
  userProfiles?: number;
  flags?: number;
  feedbacks?: number;
  postVersions?: number;
  postReplacements?: number;
  modActions?: number;
  bulkUpdateRequests?: number;
  tagAliases?: number;
  tagImplications?: number;
}
