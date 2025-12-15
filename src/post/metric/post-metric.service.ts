import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfMonth, sub } from 'date-fns';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
  expandInto,
  generateSeriesLastTileCountPoints,
} from 'src/common';
import { Repository } from 'typeorm';

import { PostLifecycleEntity } from '../lifecycle/post-lifecycle.entity';
import { PostPendingTilesEntity } from '../tiles/post-pending-tiles.entity';
import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostLifecycleEntity)
    private readonly lifecycleRepository: Repository<PostLifecycleEntity>,
    @InjectRepository(PostPendingTilesEntity)
    private readonly postPendingTilesRepository: Repository<PostPendingTilesEntity>,
  ) {}

  /**
   * Posts can only be pending for 30 days after upload.
   * For performance reasons and for issues with sync misalignment (uploads, approvals/deletions, permits),
   * we choose a period of 2 months. 1 month would likely suffice.
   */
  private pendingCutoffDate(range: DateRange) {
    return sub(startOfMonth(range.startDate), { months: 2 });
  }

  private inRange(column: string) {
    return `${column} >= :after AND ${column} < :before`;
  }

  @Cacheable({
    prefix: 'post',
    ttl: 5 * 60 * 1000,
    dependencies: [PostLifecycleEntity, PostPendingTilesEntity],
  })
  async statusSummary(
    partialRange?: PartialDateRange,
  ): Promise<PostStatusSummary> {
    const range = DateRange.fill(partialRange);
    const cutOff = this.pendingCutoffDate(range);

    const result = await this.lifecycleRepository.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE approved_at >= $1 AND approved_at < $2) as approved,
        COUNT(*) FILTER (WHERE deleted_at >= $1 AND deleted_at < $2) as deleted,
        COUNT(*) FILTER (WHERE permitted_at >= $1 AND permitted_at < $2) as permitted,
        COUNT(*) FILTER (WHERE
          (approved_at IS NULL OR approved_at >= $2)
          AND (deleted_at IS NULL OR deleted_at >= $2)
          AND (permitted_at IS NULL OR permitted_at >= $2)
        ) as pending
      FROM post_lifecycle
      WHERE uploaded_at >= $1
        AND (
          (uploaded_at >= $3 AND uploaded_at < $2)
          OR (uploaded_at < $2
              AND (approved_at IS NULL OR approved_at >= $2)
              AND (deleted_at IS NULL OR deleted_at >= $2)
              AND (permitted_at IS NULL OR permitted_at >= $2)
          )
        )
      `,
      [cutOff, range.endDate, range.startDate],
    );

    return new PostStatusSummary({
      approved: parseInt(result[0]?.approved || '0'),
      deleted: parseInt(result[0]?.deleted || '0'),
      permitted: parseInt(result[0]?.permitted || '0'),
      pending: parseInt(result[0]?.pending || '0'),
    });
  }

  @Cacheable({
    prefix: 'post',
    ttl: 10 * 60 * 1000,
    dependencies: [PostPendingTilesEntity],
    disable: true,
  })
  async pendingSeries(
    partialRange?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    const range = DateRange.fill(partialRange);

    const tiles = await this.postPendingTilesRepository.find({
      where: {
        time: range.find(),
      },
      order: {
        time: 'ASC',
      },
    });

    return generateSeriesLastTileCountPoints(
      tiles.map((tile) => new DateRange(expandInto(tile.time, TimeScale.Hour))),
      tiles.map((tile) => tile.count),
      range,
    );
  }
}
