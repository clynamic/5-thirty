import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { max, min, sub } from 'date-fns';
import { Cacheable } from 'src/app/browser.module';
import { PostEventEntity } from '../../post-event/post-event.entity';
import {
  collapseTimeScaleDuration,
  convertKeysToCamelCase,
  convertKeysToDate,
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
} from 'src/common';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Brackets, Repository } from 'typeorm';

import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

  @Cacheable({
    prefix: 'post',
    ttl: 5 * 60 * 1000,
    dependencies: [PostVersionEntity, PostEventEntity, PermitEntity],
  })
  async statusSummary(
    partialRange?: PartialDateRange,
  ): Promise<PostStatusSummary> {
    const range = DateRange.fill(partialRange);

    const posts = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .addSelect('MAX(approval_event.created_at)', 'approval_date')
      .addSelect('MAX(deletion_event.created_at)', 'deletion_date')
      .addSelect('MAX(permit.created_at)', 'permit_date')
      .leftJoin(
        PostEventEntity,
        'approval_event',
        "post_version.post_id = approval_event.post_id AND approval_event.action = 'approved'",
      )
      .leftJoin(
        PostEventEntity,
        'deletion_event',
        "post_version.post_id = deletion_event.post_id AND deletion_event.action = 'deleted'",
      )
      .leftJoin(PermitEntity, 'permit', 'post_version.post_id = permit.post_id')
      .where('post_version.version = 1')
      .andWhere(
        new Brackets((qb) => {
          qb.where('post_version.updated_at BETWEEN :start AND :end', {
            start: range.startDate,
            end: range.endDate,
          }).orWhere(
            new Brackets((subQb) => {
              subQb
                .where('approval_event.created_at IS NULL')
                .andWhere('deletion_event.created_at IS NULL')
                .andWhere('permit.post_id IS NULL')
                .andWhere('post_version.updated_at <= :end', {
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
    dependencies: [PostVersionEntity, PermitEntity, PostEventEntity],
  })
  async pendingSeries(
    partialRange?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    const range = DateRange.fill(partialRange);

    const posts = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .addSelect('MAX(post_version.updated_at)', 'updated_at')
      .addSelect('MIN(approval_event.created_at)', 'approval_date')
      .addSelect('MIN(deletion_event.created_at)', 'deletion_date')
      .leftJoin(
        PostEventEntity,
        'approval_event',
        "post_version.post_id = approval_event.post_id AND approval_event.action = 'approved'",
      )
      .leftJoin(
        PostEventEntity,
        'deletion_event',
        "post_version.post_id = deletion_event.post_id AND deletion_event.action = 'deleted'",
      )
      .leftJoin(PermitEntity, 'permit', 'post_version.post_id = permit.post_id')
      .where('post_version.version = 1')
      .andWhere('post_version.updated_at <= :end', { end: range.endDate })
      .andWhere('permit.post_id IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('approval_event.created_at IS NULL').orWhere(
            'approval_event.created_at > :start',
            { start: range.startDate },
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('deletion_event.created_at IS NULL').orWhere(
            'deletion_event.created_at > :start',
            { start: range.startDate },
          );
        }),
      )
      .groupBy('post_version.post_id')
      .getRawMany<{
        post_id: number;
        updated_at: string;
        approval_date: string | null;
        deletion_date: string | null;
      }>()
      .then((results) =>
        results
          .map(convertKeysToCamelCase)
          .map((result) =>
            convertKeysToDate(result, [
              'updatedAt',
              'approvalDate',
              'deletionDate',
            ]),
          ),
      );

    const scale = collapseTimeScaleDuration(range.scale);

    const dates = posts
      .map((post) => {
        const startDate = max([post.updatedAt, range.startDate]);

        const handledDate = post.approvalDate ?? post.deletionDate;

        const endDate = min([
          handledDate ? sub(handledDate, { [scale]: 1 }) : new Date(),
          range.endDate,
        ]);

        if (startDate > endDate) return null;

        return new DateRange({ startDate, endDate });
      })
      .filter((date): date is DateRange => date !== null);

    return generateSeriesCountPoints(dates, range);
  }
}
