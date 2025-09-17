import { ApiProperty } from '@nestjs/swagger';
import { Raw, TimeScale } from 'src/common';
import { Activity } from 'src/performance/metric/performance-metric.dto';

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
    enum: TimeScale,
    enumName: 'TimeScale',
  })
  timescale: TimeScale;

  @ApiProperty({
    enum: Activity,
    enumName: 'Activity',
  })
  activity: Activity;
}
