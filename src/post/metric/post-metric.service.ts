import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfMonth, sub } from 'date-fns';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
  convertKeysToCamelCase,
  expandInto,
  generateSeriesLastTileCountPoints,
} from 'src/common';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Brackets, Repository } from 'typeorm';

import { PostEventEntity } from '../../post-event/post-event.entity';
import { PostPendingTilesEntity } from '../tiles/post-pending-tiles.entity';
import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
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
    dependencies: [PostVersionEntity, PostEventEntity, PermitEntity],
  })
  async statusSummary(
    partialRange?: PartialDateRange,
  ): Promise<PostStatusSummary> {
    const range = DateRange.fill(partialRange);
    const cutOff = this.pendingCutoffDate(range);

    const posts = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .addSelect('MAX(approval_event.created_at)', 'approval_date')
      .addSelect('MAX(deletion_event.created_at)', 'deletion_date')
      .addSelect('MAX(permit.created_at)', 'permit_date')
      .leftJoin(
        PostEventEntity,
        'approval_event',
        `post_version.post_id = approval_event.post_id AND approval_event.action = 'approved' AND ${this.inRange('approval_event.created_at')}`,
        { after: cutOff, before: range.endDate },
      )
      .leftJoin(
        PostEventEntity,
        'deletion_event',
        `post_version.post_id = deletion_event.post_id AND deletion_event.action = 'deleted' AND ${this.inRange('deletion_event.created_at')}`,
        { after: cutOff, before: range.endDate },
      )
      .leftJoin(
        PermitEntity,
        'permit',
        `post_version.post_id = permit.id AND ${this.inRange('permit.created_at')}`,
        { after: cutOff, before: range.endDate },
      )
      .where('post_version.version = 1')
      .andWhere('post_version.updated_at >= :cutOff', { cutOff })
      .andWhere(
        new Brackets((qb) => {
          qb.where({ updatedAt: range.find() }).orWhere(
            new Brackets((subQb) => {
              subQb
                .where('approval_event.created_at IS NULL')
                .andWhere('deletion_event.created_at IS NULL')
                .andWhere('permit.id IS NULL')
                .andWhere('post_version.updated_at < :end', {
                  end: range.endDate,
                });
            }),
          );
        }),
      )
      .groupBy('post_version.post_id')
      .getRawMany<{
        post_id: number;
        approval_date: Date | null;
        deletion_date: Date | null;
        permit_date: Date | null;
      }>()
      .then((results) => results.map(convertKeysToCamelCase));

    const approved = posts.filter((result) => result.approvalDate).length;
    const deleted = posts.filter((result) => result.deletionDate).length;
    const permitted = posts.filter((result) => result.permitDate).length;
    const pending = posts.filter(
      (result) =>
        !result.approvalDate && !result.deletionDate && !result.permitDate,
    ).length;

    return new PostStatusSummary({
      approved,
      deleted,
      permitted,
      pending,
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
