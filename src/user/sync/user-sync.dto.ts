import { IsNumber, IsOptional } from 'class-validator';
import { Raw } from 'src/common';

import { NotabilityType } from '../notable-user.entity';

export class NotableUserQuery {
  constructor(value: Raw<NotableUserQuery> = {}) {
    Object.assign(this, value);
  }

  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  type?: NotabilityType[];

  @IsOptional()
  newerThan?: Date;
}
