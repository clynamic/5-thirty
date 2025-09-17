import { ApiProperty } from '@nestjs/swagger';
import { Raw } from 'src/common';

export const defaultMotd = 'Your valiant efforts are appreciated.';

export type MotdTier = 'absolute' | 'featured' | 'default';

export interface MotdEntity {
  message: string;
  weight?: number;
  date?: string;
  schedule?: string;
  tier?: MotdTier;
}

export class Motd {
  constructor(value: Raw<Motd>) {
    Object.assign(this, value);
  }

  @ApiProperty({
    description: 'The message of the day',
    example: 'Your valiant efforts are appreciated.',
  })
  message: string;
}
