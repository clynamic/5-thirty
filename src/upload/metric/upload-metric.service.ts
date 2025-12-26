import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
  convertKeysToCamelCase,
  expandInto,
  generateSeriesCountPoints,
  generateSeriesTileCountPoints,
} from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { UploadTilesEntity } from 'src/upload/tiles/upload-tiles.entity';
import { Repository } from 'typeorm';

import { PostUploaderSummary } from './upload-metric.dto';

@Injectable()
export class UploadMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(UploadTilesEntity)
    private readonly uploadTilesRepository: Repository<UploadTilesEntity>,
  ) {}

  @Cacheable({
    prefix: 'upload',
    ttl: 10 * 60 * 1000,
    dependencies: [UploadTilesEntity],
    disable: true,
  })
  async count(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const tiles = await this.uploadTilesRepository.find({
      where: {
        time: range.find(),
      },
      order: {
        time: 'ASC',
      },
    });

    return generateSeriesTileCountPoints(
      tiles.map((tile) => new DateRange(expandInto(tile.time, TimeScale.Hour))),
      tiles.map((tile) => tile.count),
      range,
    );
  }

  // TODO: Tile by uploader?

  @Cacheable({
    prefix: 'upload',
    ttl: 10 * 60 * 1000,
    dependencies: [PostVersionEntity],
  })
  async countUploader(
    uploaderId: number,
    range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const postVersions = await this.postVersionRepository.find({
      select: ['updatedAt'],
      where: {
        version: 1, // only uploads
        updatedAt: range.find(),
        updaterId: uploaderId,
      },
    });

    return generateSeriesCountPoints(
      postVersions.map((item) => item.updatedAt),
      range,
    );
  }

  @Cacheable({
    prefix: 'upload',
    ttl: 15 * 60 * 1000,
    dependencies: [PostVersionEntity],
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

    return results.map(
      (row) =>
        new PostUploaderSummary({
          ...convertKeysToCamelCase(row),
        }),
    );
  }
}
