import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfMonth, sub } from 'date-fns';
import { Invalidates } from 'src/app/browser.module';
import {
  DateRange,
  TileService,
  TilingRange,
  chunkDateRange,
  findMissingOrStaleTiles,
  getTilingRanges,
  groupTimesIntoRanges,
} from 'src/common';
import { ItemType } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Repository } from 'typeorm';

import {
  PostPendingTilesData,
  PostPendingTilesEntity,
} from './post-pending-tiles.entity';

@Injectable()
export class PostPendingTilesService implements TileService {
  readonly interval = 1;

  constructor(
    @InjectRepository(PostPendingTilesEntity)
    private readonly tileRepository: Repository<PostPendingTilesEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
  ) {}

  private pendingCutoffDate(range: DateRange) {
    return sub(startOfMonth(range.startDate), { months: 2 });
  }

  async getRanges(): Promise<TilingRange[]> {
    const manifests = await this.manifestRepository.find({
      where: [
        { type: ItemType.postVersions },
        { type: ItemType.postEvents },
        { type: ItemType.permits },
      ],
    });

    return getTilingRanges(manifests);
  }

  @Invalidates(PostPendingTilesEntity)
  async upsert(tiles: PostPendingTilesEntity[]): Promise<void> {
    if (tiles.length === 0) return;

    await this.tileRepository
      .createQueryBuilder()
      .insert()
      .into(PostPendingTilesEntity)
      .values(tiles)
      .orUpdate(['count', 'updated_at'], ['time'])
      .execute();
  }

  async generate(times: Date[]): Promise<Map<string, PostPendingTilesData>> {
    if (times.length === 0) {
      return new Map();
    }

    const ranges = groupTimesIntoRanges(times);
    const results = new Map<string, PostPendingTilesData>();

    for (const range of ranges) {
      const chunks = chunkDateRange(range, 24 * 30);

      for (const chunk of chunks) {
        const cutOff = this.pendingCutoffDate(chunk);

        const query = `
        WITH pending_posts AS (
          SELECT 
            post_version.post_id,
            date_trunc('hour', post_version.updated_at) AS upload_hour,
            COALESCE(
              date_trunc('hour', MIN(approval_event.created_at)),
              date_trunc('hour', MIN(deletion_event.created_at)),
              date_trunc('hour', NOW()) + interval '1 hour'
            ) AS handled_hour
          FROM post_versions post_version
          LEFT JOIN post_events approval_event 
            ON post_version.post_id = approval_event.post_id 
            AND approval_event.action = 'approved'
            AND approval_event.created_at >= $3
            AND approval_event.created_at < $4
          LEFT JOIN post_events deletion_event 
            ON post_version.post_id = deletion_event.post_id 
            AND deletion_event.action = 'deleted'
            AND deletion_event.created_at >= $3
            AND deletion_event.created_at < $4
          LEFT JOIN permits permit 
            ON post_version.post_id = permit.id 
            AND permit.created_at >= $3
            AND permit.created_at < $4
          WHERE post_version.version = 1
            AND post_version.updated_at >= $3
            AND post_version.updated_at < $4
            AND permit.id IS NULL
            AND (approval_event.created_at IS NULL OR approval_event.created_at > $1)
            AND (deletion_event.created_at IS NULL OR deletion_event.created_at > $1)
          GROUP BY post_version.post_id, upload_hour
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
          COUNT(pending_posts.post_id) AS count
        FROM hour_series
        LEFT JOIN pending_posts 
          ON hour_series.hour >= pending_posts.upload_hour
          AND hour_series.hour < pending_posts.handled_hour
        GROUP BY hour_series.hour
        ORDER BY hour_series.hour
      `;

        const result = await this.postVersionRepository.query(query, [
          chunk.startDate,
          chunk.endDate,
          cutOff,
          chunk.endDate,
        ]);

        result.forEach((row: { time: Date; count: string }) =>
          results.set(new Date(row.time).toISOString(), {
            count: parseInt(row.count, 10),
          }),
        );
      }
    }

    return results;
  }

  async findMissing(range: TilingRange): Promise<Date[]> {
    return findMissingOrStaleTiles(this.tileRepository, range);
  }

  @Invalidates(PostPendingTilesEntity)
  async wipe(): Promise<void> {
    await this.tileRepository.clear();
  }
}
