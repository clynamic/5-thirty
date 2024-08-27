import dayjs from 'dayjs';

export const getRangeString = (
  start?: string | number,
  end?: string | number,
  inclusive = false,
): string => {
  const grt = inclusive ? '>=' : '>';
  const lss = inclusive ? '<=' : '<';

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

export interface DateRange {
  start: Date;
  end: Date;
}

export const getCurrentMonthRange = (): DateRange => {
  const now = dayjs();
  const firstDay = now.startOf('month').format('YYYY-MM-DD');
  const lastDay = now.endOf('month').format('YYYY-MM-DD');

  return {
    start: new Date(firstDay),
    end: new Date(lastDay),
  };
};

export const getDateRangeString = (range: DateRange): string =>
  getRangeString(
    dayjs(range.start).format('YYYY-MM-DD'),
    dayjs(range.end).format('YYYY-MM-DD'),
    true,
  );

export interface WithId {
  id: number;
}

export const findLowestId = (items: WithId[] | undefined) => {
  if (items == null || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id < current.id ? prev : current,
  );
};

export const findHighestId = (items: WithId[] | undefined) => {
  if (items == null || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    prev.id > current.id ? prev : current,
  );
};

export const findIdBounds = (items: WithId[] | undefined) => {
  return {
    lowest: findLowestId(items),
    highest: findHighestId(items),
  };
};

export interface WithCreationDate {
  createdAt: Date;
}

export const findLowestDate = (items: WithCreationDate[] | undefined) => {
  if (items == null || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    dayjs(prev.createdAt).isBefore(current.createdAt) ? prev : current,
  );
};

export const findHighestDate = (items: WithCreationDate[] | undefined) => {
  if (items == null || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    dayjs(prev.createdAt).isAfter(current.createdAt) ? prev : current,
  );
};
