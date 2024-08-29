import dayjs from 'dayjs';

import { DateRange, PartialDateRange } from './date-range.dto';

export const getCurrentMonthRange = (): DateRange => {
  const now = dayjs().utc();
  const firstDay = now.startOf('month').format('YYYY-MM-DD');
  const lastDay = now.endOf('month').format('YYYY-MM-DD');

  return new DateRange({
    startDate: new Date(firstDay),
    endDate: new Date(lastDay),
  });
};

export const getTwoMonthsRange = (): DateRange => {
  const now = dayjs().utc();
  const firstDay = now
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD');
  const lastDay = now.endOf('month').format('YYYY-MM-DD');

  return new DateRange({
    startDate: new Date(firstDay),
    endDate: new Date(lastDay),
  });
};

export const getDateRangeString = (range: PartialDateRange): string => {
  const start = dayjs(range.startDate).format('YYYY-MM-DD');
  const end = dayjs(range.endDate).format('YYYY-MM-DD');

  const grt = '>=';
  const lss = '<=';

  if (start && !end) {
    return `${grt}${start}`;
  } else if (!start && end) {
    return `${lss}${end}`;
  } else if (start && end) {
    return `${grt}${start}${lss}${end}`;
  } else {
    return '';
  }
};

export interface WithId {
  id: number;
}

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

export const findLowestId = <T extends WithId>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id < current.id ? prev : current,
  );
};

export const findHighestId = <T extends WithId>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id > current.id ? prev : current,
  );
};

export const findIdBounds = <T extends WithId>(items: T[] | undefined) => {
  return {
    lowest: findLowestId(items),
    highest: findHighestId(items),
  };
};

export interface WithCreationDate {
  createdAt: Date;
}

export const findLowestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    dayjs(prev.createdAt).isBefore(current.createdAt) ? prev : current,
  );
};

export const findHighestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    dayjs(prev.createdAt).isAfter(current.createdAt) ? prev : current,
  );
};

export const findContiguityGaps = <T extends WithId>(
  items: T[] | undefined,
): Map<number, number> => {
  const idGapMap = new Map<number, number>();

  if (items === undefined || items.length < 2) return idGapMap;

  const sorted = items.slice().sort((a, b) => a.id - b.id);

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i]!.id - sorted[i - 1]!.id - 1;
    if (gap > 0) {
      idGapMap.set(sorted[i - 1]!.id, gap);
    }
  }

  return idGapMap;
};
