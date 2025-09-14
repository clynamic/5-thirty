import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PartialDateRange,
  SeriesCountPoint,
  generateSeriesCountPoints,
} from 'src/common';
import { Repository } from 'typeorm';

import { PermitEntity } from '../permit.entity';

@Injectable()
export class PermitMetricService {
  constructor(
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
  ) {}

  @Cacheable({
    prefix: 'permit',
    ttl: 10 * 60 * 1000,
    dependencies: [PermitEntity],
  })
  async count(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const permits = await this.permitRepository.find({
      select: ['createdAt'],
      where: {
        createdAt: range.find(),
      },
    });

    return generateSeriesCountPoints(
      permits.map((permit) => permit.createdAt),
      range,
    );
  }
}
