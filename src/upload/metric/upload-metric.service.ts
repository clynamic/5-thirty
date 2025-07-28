import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesCountPoints,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
  toRawQuery,
} from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { UserHeadService } from 'src/user/head/user-head.service';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import {
  PostUploaderSummary,
  PostUploadSeriesQuery,
} from './upload-metric.dto';

@Injectable()
export class UploadMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    private readonly userHeadService: UserHeadService,
  ) {}

  static getCountKey(
    range?: PartialDateRange,
    query?: PostUploadSeriesQuery,
  ): string {
    return `upload-count?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(UploadMetricService.getCountKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [PostVersionEntity],
  })
  async count(
    range?: PartialDateRange,
    query?: PostUploadSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const postVersions = await this.postVersionRepository.find({
      select: ['updatedAt'],
      where: {
        version: 1, // only uploads
        updatedAt: range.find(),
        ...query?.where(),
      },
    });

    return generateSeriesCountPoints(
      postVersions.map((item) => item.updatedAt),
      range,
    );
  }

  static getUploadersKey(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): string {
    return `upload-uploaders?${toRawQuery({ ...range, ...pages })}`;
  }

  @Cacheable(UploadMetricService.getUploadersKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [PostVersionEntity, 'UserHeadService'],
  })
  async uploaders(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<PostUploaderSummary[]> {
    const results = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .where({
        updatedAt: DateRange.fill(range).find(),
        version: 1,
      })
      .select('post_version.updater_id', 'user_id')
      .addSelect('COUNT(post_version.id)', 'total')
      .addSelect('COUNT(DISTINCT DATE(post_version.updated_at))', 'days')
      .addSelect(
        `RANK() OVER (ORDER BY COUNT(post_version.id) DESC)`,
        'position',
      )
      .groupBy('post_version.updater_id')
      .orderBy('total', 'DESC')
      .take(pages?.limit || PaginationParams.DEFAULT_PAGE_SIZE)
      .skip(PaginationParams.calculateOffset(pages))
      .getRawMany<{
        user_id: number;
        total: number;
        days: number;
        position: number;
      }>();

    const ids = results.map((row) => row.user_id);

    const heads = await this.userHeadService.get(ids);

    return results.map(
      (row) =>
        new PostUploaderSummary({
          ...convertKeysToCamelCase(row),
          head: heads.find((head) => head.id === row.user_id),
        }),
    );
  }
}
