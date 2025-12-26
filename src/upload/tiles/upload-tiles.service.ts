import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invalidates } from 'src/app/browser.module';
import {
  TileService,
  TilingRange,
  findMissingOrStaleTiles,
  getTilingRanges,
  groupTimesIntoRanges,
} from 'src/common';
import { ItemType } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Repository } from 'typeorm';

import { UploadTilesData, UploadTilesEntity } from './upload-tiles.entity';

@Injectable()
export class UploadTilesService implements TileService {
  readonly interval = 1;

  constructor(
    @InjectRepository(UploadTilesEntity)
    private readonly tileRepository: Repository<UploadTilesEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
  ) {}

  async getRanges(): Promise<TilingRange[]> {
    const types = [ItemType.postVersions];

    const manifests = await this.manifestRepository.find({
      where: types.map((type) => ({ type })),
    });

    return getTilingRanges(manifests, types);
  }

  @Invalidates(UploadTilesEntity)
  async upsert(tiles: UploadTilesEntity[]): Promise<void> {
    if (tiles.length === 0) return;

    await this.tileRepository
      .createQueryBuilder()
      .insert()
      .into(UploadTilesEntity)
      .values(tiles)
      .orUpdate(['count', 'updated_at'], ['time'])
      .execute();
  }

  async generate(times: Date[]): Promise<Map<string, UploadTilesData>> {
    if (times.length === 0) {
      return new Map();
    }

    const ranges = groupTimesIntoRanges(times);
    const results = new Map<string, UploadTilesData>();

    for (const range of ranges) {
      const result = await this.postVersionRepository
        .createQueryBuilder('post_version')
        .select("date_trunc('hour', post_version.updated_at)", 'time')
        .addSelect('COUNT(*)', 'count')
        .where('post_version.version = :version', { version: 1 })
        .andWhere('post_version.updated_at >= :start', {
          start: range.startDate,
        })
        .andWhere('post_version.updated_at < :end', { end: range.endDate })
        .groupBy("date_trunc('hour', post_version.updated_at)")
        .getRawMany<{ time: Date; count: string }>();

      result.forEach((row) =>
        results.set(new Date(row.time).toISOString(), {
          count: parseInt(row.count, 10),
        }),
      );
    }

    return results;
  }

  async findMissing(range: TilingRange): Promise<Date[]> {
    return findMissingOrStaleTiles(this.tileRepository, range);
  }

  @Invalidates(UploadTilesEntity)
  async wipe(): Promise<void> {
    await this.tileRepository.clear();
  }
}
