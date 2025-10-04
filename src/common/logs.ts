import { Logger } from '@nestjs/common';
import { ItemType } from 'src/label/label.entity';
import { Order } from 'src/manifest/manifest.entity';

import { WithDate, findDateBounds } from './date';
import { WithId, findContiguityGaps, findIdBounds } from './id-range.dto';

/**
 * Log the order fetch for a given item type and order.
 */
export const logOrderFetch = (logger: Logger, type: ItemType, order: Order) => {
  const { dateRange, idRange } = order;

  logger.log(
    `Fetching ${type} for ${dateRange.toE621RangeString()} with ids ${idRange.toE621RangeString()}`,
  );
};

/**
 * Log the order result for a given item type.
 */
export const logOrderResult = (
  logger: Logger,
  type: ItemType,
  items: (WithId & WithDate)[],
) => {
  const idRange = findIdBounds(items);
  const dateRange = findDateBounds(items);
  logger.log(
    `Found ${items.length} ${type} with ids ${
      idRange.toE621RangeString() || 'none'
    } and dates ${dateRange.toE621RangeString() || 'none'}`,
  );
};

/**
 * Log the contiguity gaps in a given list of items.
 */
export const logContiguityGaps = (
  logger: Logger,
  type: ItemType,
  items: WithId[],
) => {
  const gaps = findContiguityGaps(items);
  if (gaps.length > 0) {
    logger.warn(
      `Found ${gaps.length} gaps in ${type} ID contiguity: ${JSON.stringify(gaps)},`,
    );
  }
};
