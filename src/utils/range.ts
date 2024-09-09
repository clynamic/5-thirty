import { DateTime } from 'luxon';

import { DateRange, PartialDateRange } from './date-range.dto';

/**
 * Gets the range for the current month.
 */
export const getCurrentMonthRange = (): DateRange => {
  const now = DateTime.now();
  return new DateRange({
    startDate: now.startOf('month').toJSDate(),
    endDate: now.endOf('month').toJSDate(),
  });
};

/**
 * Gets the range for "recent" months.
 * This is defined as the current month plus the 3 previous months.
 */
export const getRecentDateRange = (): DateRange => {
  const now = DateTime.now();
  return new DateRange({
    startDate: now
      .minus({
        months: 3,
      })
      .startOf('month')
      .toJSDate(),
    endDate: now.endOf('month').toJSDate(),
  });
};

/**
 * Turns a date range into a string fit for an e621 search query.
 * Inclusive on both ends.
 */
export const getDateRangeString = (range: PartialDateRange): string => {
  let start = '';
  let end = '';

  if (range.startDate) {
    start = DateTime.fromJSDate(range.startDate)
      .minus({
        days: 1,
      })
      .toISODate()!;
  }

  if (range.endDate) {
    end = DateTime.fromJSDate(range.endDate)
      .plus({
        days: 1,
      })
      .toISODate()!;
  }

  if (start && !end) {
    return `>${start}`;
  } else if (!start && end) {
    return `<${end}`;
  } else if (start && end) {
    return `${start}..${end}`;
  } else {
    return '';
  }
};

export interface WithId {
  id: number;
}

/**
 * Turns a range of IDs into a string fit for an e621 search query.
 * Exclusive on both ends.
 */
export const getIdRangeString = (
  start: number | undefined,
  end: number | undefined,
): string => {
  if (start && !end) {
    return `>${start}`;
  } else if (!start && end) {
    return `<${end}`;
  } else if (start && end) {
    return `${start}...${end}`;
  }
  return '';
};

/**
 * Finds the lowest ID in a list of items.
 */
export const findLowestId = <T extends WithId>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id < current.id ? prev : current,
  );
};

/**
 * Finds the highest ID in a list of items.
 */
export const findHighestId = <T extends WithId>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id > current.id ? prev : current,
  );
};

/**
 * Finds the bounds of a list of items by ID.
 */
export const findIdBounds = <T extends WithId>(items: T[] | undefined) => {
  return {
    lowest: findLowestId(items),
    highest: findHighestId(items),
  };
};

export interface WithCreationDate {
  createdAt: Date;
}

/**
 * Finds the least recent creation date in a list of items.
 */
export const findLowestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    DateTime.fromJSDate(prev.createdAt) < DateTime.fromJSDate(current.createdAt)
      ? prev
      : current,
  );
};

/**
 * Finds the most recent creation date in a list of items.
 */
export const findHighestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    DateTime.fromJSDate(prev.createdAt) > DateTime.fromJSDate(current.createdAt)
      ? prev
      : current,
  );
};

/**
 * Finds gaps in the contiguity of IDs in a list of items.
 */
export const findContiguityGaps = <T extends WithId>(
  items: T[] | undefined,
): Record<number, number>[] => {
  const idGapMap = new Map<number, number>();

  if (items === undefined || items.length < 2) return [];

  const sorted = items.slice().sort((a, b) => a.id - b.id);

  for (let i = 1; i < sorted.length; i++) {
    const j = i - 1;
    const gap = sorted[i]!.id - sorted[j]!.id - 1;
    if (gap > 0) {
      idGapMap.set(sorted[j]!.id, gap);
    }
  }

  return Array.from(idGapMap.entries()).map(([id, gap]) => ({ [id]: gap }));
};
