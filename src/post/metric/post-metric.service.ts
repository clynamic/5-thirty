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
import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostLifecycleEntity)
    private readonly lifecycleRepository: Repository<PostLifecycleEntity>,
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
    dependencies: [PostLifecycleEntity],
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
    ttl: 5 * 60 * 1000,
    dependencies: [PostLifecycleEntity],
  })
  async pendingSeries(
    partialRange?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    const range = DateRange.fill(partialRange);
    const cutOff = this.pendingCutoffDate(range);

    const query = `
      WITH initial_count AS (
        SELECT COUNT(*) AS count
        FROM post_lifecycle
        WHERE uploaded_at >= $3
          AND uploaded_at < $1
          AND permitted_at IS NULL
          AND (approved_at IS NULL OR approved_at >= $1)
          AND (deleted_at IS NULL OR deleted_at >= $1)
      ),
      pending_posts AS (
        SELECT
          post_id,
          date_trunc('hour', uploaded_at) AS upload_hour,
          COALESCE(
            date_trunc('hour', LEAST(approved_at, deleted_at)),
            $2::timestamptz
          ) AS handled_hour
        FROM post_lifecycle
        WHERE uploaded_at >= $3
          AND uploaded_at < $4
          AND permitted_at IS NULL
          AND (approved_at IS NULL OR approved_at > $1)
          AND (deleted_at IS NULL OR deleted_at > $1)
      ),
      events AS (
        SELECT upload_hour AS hour, 1 AS change
        FROM pending_posts
        WHERE upload_hour >= $1
        UNION ALL
        SELECT handled_hour AS hour, -1 AS change
        FROM pending_posts
        WHERE handled_hour >= $1 AND handled_hour < $2
      ),
      event_aggregates AS (
        SELECT hour, SUM(change) AS change
        FROM events
        GROUP BY hour
      ),
      hour_series AS (
        SELECT generate_series(
          $1::timestamptz,
          $2::timestamptz - interval '1 hour',
          interval '1 hour'
        ) AS hour
      )
      SELECT
        hour_series.hour AS time,
        (SELECT count FROM initial_count) + COALESCE(
          SUM(event_aggregates.change) OVER (ORDER BY hour_series.hour ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),
          0
        ) AS count
      FROM hour_series
      LEFT JOIN event_aggregates ON hour_series.hour = event_aggregates.hour
      ORDER BY hour_series.hour
    `;

    const result = (await this.lifecycleRepository.query(query, [
      range.startDate,
      range.endDate,
      cutOff,
      range.endDate,
    ])) as Array<{ time: Date; count: string }>;

    return generateSeriesLastTileCountPoints(
      result.map((row) => new DateRange(expandInto(row.time, TimeScale.Hour))),
      result.map((row) => parseInt(row.count, 10)),
      range,
    );
  }
}
