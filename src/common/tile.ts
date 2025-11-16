import { add, isEqual, max, min } from 'date-fns';
import { Repository } from 'typeorm';

import { DateRange, TimeScale, startOf } from './date';

export enum TileType {
  uploadHourly = 'upload_hourly',
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
   * Wipe all tiles of this type.
   */
  wipe: () => Promise<void>;
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
}

export const getTilingRanges = (
  manifests: Array<TilingRange>,
): TilingRange[] => {
  if (manifests.length === 0) return [];

  const ranges = manifests.map((m) => ({
    start: startOf(TimeScale.Hour, m.dateRange.startDate),
    end: add(startOf(TimeScale.Hour, m.dateRange.endDate), { hours: 1 }),
    updatedAt: m.updatedAt,
  }));

  const overallStart = max(ranges.map((r) => r.start));
  const overallEnd = min(ranges.map((r) => r.end));

  if (overallStart >= overallEnd) return [];

  const updatedAt = ranges.every((r) => r.updatedAt !== undefined)
    ? max(ranges.map((r) => r.updatedAt!))
    : undefined;

  return [
    {
      dateRange: new DateRange({
        startDate: overallStart,
        endDate: overallEnd,
        scale: TimeScale.Hour,
      }),
      updatedAt,
    },
  ];
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
