import { add, isEqual, min } from 'date-fns';
import { Repository } from 'typeorm';

import { DateRange, PartialDateRange, TimeScale, startOf } from './date';

export enum TileType {
  uploadHourly = 'upload_hourly',
  postPendingHourly = 'post_pending_hourly',
}

export interface TileService {
  /**
   * Interval in hours between tiles of this type.
   */
  interval: number;

  /**
   * Get the available tiling ranges for this tile type.
   */
  getRanges: () => Promise<TilingRange[]>;

  /**
   * Find missing tiles in the given date range.
   */
  findMissing: (range: TilingRange) => Promise<Date[]>;

  /**
   * Wipe all tiles of this type, or tiles within a date range if specified.
   */
  wipe: (range?: PartialDateRange) => Promise<void>;
}

export interface TilingRange {
  /**
   * The date range for the tiles.
   */
  dateRange: DateRange;

  /**
   * The minimum updatedAt timestamp for the tiles in this range.
   */
  updatedAt?: Date;

  /**
   * Type identifier for this range. Undefined when not applicable.
   */
  type?: string;
}

export const getTilingRanges = (
  manifests: Array<TilingRange>,
  types: string[],
): TilingRange[] => {
  const events: Array<{
    time: Date;
    type: string;
    delta: number;
    updatedAt?: Date;
  }> = [];

  for (const manifest of manifests) {
    const type = manifest.type ?? 'default';
    const start = startOf(TimeScale.Hour, manifest.dateRange.startDate);
    const end = add(startOf(TimeScale.Hour, manifest.dateRange.endDate), {
      hours: 1,
    });

    events.push({ time: start, type, delta: 1, updatedAt: manifest.updatedAt });
    events.push({ time: end, type, delta: -1, updatedAt: manifest.updatedAt });
  }

  events.sort((a, b) => {
    const diff = a.time.getTime() - b.time.getTime();
    if (diff !== 0) return diff;
    return b.delta - a.delta;
  });

  const depths = new Map<string, number>();

  const ranges: TilingRange[] = [];
  let start: Date | null = null;
  let updated: Date | undefined = undefined;

  for (const event of events) {
    const prevDepth = depths.get(event.type) ?? 0;
    const newDepth = prevDepth + event.delta;
    depths.set(event.type, newDepth);

    const active = types.every((type) => (depths.get(type) ?? 0) > 0);

    if (active) {
      if (start === null) {
        start = event.time;
      }
      if (event.updatedAt && (!updated || event.updatedAt > updated)) {
        updated = event.updatedAt;
      }
    } else if (start !== null) {
      ranges.push({
        dateRange: new DateRange({
          startDate: start,
          endDate: event.time,
          scale: TimeScale.Hour,
        }),
        updatedAt: updated,
      });
      start = null;
      updated = undefined;
    }
  }

  return ranges;
};

export const groupTimesIntoRanges = (times: Date[]): DateRange[] => {
  if (times.length === 0) return [];

  const sorted = [...times].sort((a, b) => a.getTime() - b.getTime());
  const ranges: DateRange[] = [];

  let start = sorted[0]!;
  let end = add(sorted[0]!, { hours: 1 });

  for (const current of sorted.slice(1)) {
    if (isEqual(current, end)) {
      end = add(current, { hours: 1 });
    } else {
      ranges.push(
        new DateRange({
          startDate: start,
          endDate: end,
          scale: TimeScale.Hour,
        }),
      );
      start = current;
      end = add(current, { hours: 1 });
    }
  }

  ranges.push(
    new DateRange({
      startDate: start,
      endDate: end,
      scale: TimeScale.Hour,
    }),
  );

  return ranges;
};

export const chunkDateRange = (
  range: DateRange,
  maxHours: number,
): DateRange[] => {
  const chunks: DateRange[] = [];
  let current = range.startDate;

  while (current < range.endDate) {
    const chunkEnd = add(current, { hours: maxHours });
    const actualEnd = min([chunkEnd, range.endDate]);

    chunks.push(
      new DateRange({
        startDate: current,
        endDate: actualEnd,
        scale: TimeScale.Hour,
      }),
    );

    current = actualEnd;
  }

  return chunks;
};

export interface WithTileTime {
  time: Date;
  updatedAt: Date;
}

export async function findMissingOrStaleTiles<T extends WithTileTime>(
  repository: Repository<T>,
  range: TilingRange,
): Promise<Date[]> {
  const startTime = startOf(TimeScale.Hour, range.dateRange.startDate);
  const endTime = startOf(TimeScale.Hour, range.dateRange.endDate);
  const tableName = repository.metadata.tableName;

  const query = `
    SELECT series.hour AS time
    FROM generate_series(
      $1::timestamptz,
      $2::timestamptz - interval '1 hour',
      interval '1 hour'
    ) AS series(hour)
    LEFT JOIN ${tableName} tile ON tile.time = series.hour
    WHERE tile.time IS NULL
       OR ($3::timestamptz IS NOT NULL AND tile.updated_at < $3::timestamptz)
  `;

  const params = [startTime, endTime, range.updatedAt || null];
  const result = await repository.query(query, params);

  return result.map((row: { time: Date }) => row.time);
}
