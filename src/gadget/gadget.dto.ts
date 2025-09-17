import { ApiProperty } from '@nestjs/swagger';
import { Raw, TimeScale } from 'src/common';
import { Activity } from 'src/performance/metric/performance-metric.dto';

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

export class DailyActivity {
  constructor(value: Raw<DailyActivity>) {
    Object.assign(this, value);
  }

  @ApiProperty({
    description: 'The counter value',
    example: 42,
  })
  value: number;

  @ApiProperty({
    description: 'The time scale of the counter',
    enum: TimeScale,
    enumName: 'TimeScale',
  })
  timescale: TimeScale;

  @ApiProperty({
    description: 'The activity key for this counter',
    enum: Activity,
    enumName: 'Activity',
  })
  activity: Activity;
}
