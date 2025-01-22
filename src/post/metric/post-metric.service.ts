import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { max, min, sub } from 'date-fns';
import { PostFlagType } from 'src/api';
import { Cacheable } from 'src/app/browser.module';
import { ApprovalEntity } from 'src/approval/approval.entity';
import {
  collapseTimeScaleDuration,
  convertKeysToCamelCase,
  convertKeysToDate,
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
  toRawQuery,
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Brackets, Repository } from 'typeorm';

import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
  ) {}

  async statusSummary(range?: PartialDateRange): Promise<PostStatusSummary> {
    range = DateRange.fill(range);

    const posts = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .addSelect('MAX(approval.created_at)', 'approval_date')
      .addSelect('MAX(flag.created_at)', 'deletion_date')
      .addSelect('MAX(permit.created_at)', 'permit_date')
      .leftJoin(
        this.approvalRepository.metadata.tableName,
        'approval',
        'post_version.post_id = approval.post_id',
      )
      .leftJoin(
        this.flagRepository.metadata.tableName,
        'flag',
        'post_version.post_id = flag.post_id AND flag.type = :type',
        { type: PostFlagType.deletion },
      )
      .leftJoin(
        this.permitRepository.metadata.tableName,
        'permit',
        'post_version.post_id = permit.post_id',
      )
      .where('post_version.updated_at BETWEEN :start AND :end', {
        start: range.startDate,
        end: range.endDate,
      })
      .orWhere(
        new Brackets((qb) => {
          qb.where('approval.post_id IS NULL')
            .andWhere('flag.id IS NULL')
            .andWhere('permit.post_id IS NULL');
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
    );

    return new PostStatusSummary({
      approved,
      deleted,
      permitted,
      pending: pending.length,
    });
  }

  static getPendingSeriesKey(range?: PartialDateRange): string {
    range = DateRange.fill(range);
    return `pendingSeries?${toRawQuery(range)}`;
  }

  @Cacheable(PostMetricService.getPendingSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [PostVersionEntity, PermitEntity, ApprovalEntity, FlagEntity],
    disable: true,
  })
  async pendingSeries(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const posts = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .addSelect('MAX(post_version.updated_at)', 'updated_at')
      .addSelect('MAX(approval.created_at)', 'approval_date')
      .addSelect('MAX(flag.created_at)', 'deletion_date')
      .leftJoin(
        this.approvalRepository.metadata.tableName,
        'approval',
        'post_version.post_id = approval.post_id',
      )
      .leftJoin(
        this.flagRepository.metadata.tableName,
        'flag',
        'post_version.post_id = flag.post_id AND flag.type = :type',
        { type: PostFlagType.deletion },
      )
      .leftJoin(
        this.permitRepository.metadata.tableName,
        'permit',
        'post_version.post_id = permit.post_id',
      )
      .where(
        new Brackets((qb) => {
          qb.where('approval.created_at BETWEEN :start AND :end', {
            start: range.startDate,
            end: range.endDate,
          }).orWhere('flag.created_at BETWEEN :start AND :end', {
            start: range.startDate,
            end: range.endDate,
          });
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where('permit.post_id IS NULL')
            .andWhere('approval.post_id IS NULL')
            .andWhere('flag.id IS NULL')
            .andWhere('post_version.updated_at < :end', {
              end: range.endDate,
            });
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

    const scale = collapseTimeScaleDuration(range.scale!);

    const dates = posts.map((post) => {
      const startDate = max([post.updatedAt, range.startDate!]);

      const handledDate = post.approvalDate || post.deletionDate;
      const endDate = max([
        min([
          handledDate ? sub(handledDate, { [scale]: 1 }) : new Date(),
          range.endDate!,
        ]),
        range.startDate!,
      ]);

      return new DateRange({ startDate, endDate });
    });

    return generateSeriesCountPoints(dates, range);
  }
}
