import { PartialDateRange } from './date-range.dto';

/**
 * An object with a date denoting a creation time.
 */
export type WithDate = WithCreationDate | WithOnlyUpdateDate;

/**
 * An object with a creation date.
 */
export interface WithCreationDate {
  createdAt: Date;
}

/**
 * An object with an update date but no creation date.
 * The update date is assumed to be the creation date.
 */
export interface WithOnlyUpdateDate extends Exclude<object, WithCreationDate> {
  updatedAt: Date;
}

/**
 * Resolves the date of an object with a date property.
 */
export const resolveWithDate = <T extends WithDate | undefined>(
  item: T,
): T extends undefined ? undefined : Date => {
  if (item === undefined) {
    return undefined as T extends undefined ? undefined : never;
  }
  return (
    'createdAt' in item ? item.createdAt : item.updatedAt
  ) as T extends undefined ? never : Date;
};

/**
 * Finds the lowest date in a list of items.
 */
export const findLowestDate = <T extends WithDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    resolveWithDate(prev) < resolveWithDate(current) ? prev : current,
  );
};

/**
 * Finds the highest date in a list of items.
 */
export const findHighestDate = <T extends WithDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    resolveWithDate(prev) > resolveWithDate(current) ? prev : current,
  );
};

/**
 * Finds the bounds of a list of items by date.
 */
export const findDateBounds = <T extends WithDate>(
  items: T[] | undefined,
): PartialDateRange => {
  return new PartialDateRange({
    startDate: resolveWithDate(findLowestDate(items)),
    endDate: resolveWithDate(findHighestDate(items)),
  });
};
