import { IsInt, IsOptional } from 'class-validator';

export interface WithId {
  id: number;
}

export class PartialIdRange {
  constructor(partial?: Partial<PartialIdRange>) {
    Object.assign(this, partial);
  }

  /**
   * Start of the ID range, inclusive.
   */
  @IsOptional()
  @IsInt()
  startId?: number;

  /**
   * End of the ID range, inclusive.
   */
  @IsOptional()
  @IsInt()
  endId?: number;

  get isEmpty(): boolean {
    return this.startId === undefined && this.endId === undefined;
  }

  /**
   * Turns the ID range into a string fit for an e621 search query.
   * Inclusive on both ends.
   */
  toE621RangeString(): string {
    if (this.startId && !this.endId) {
      return `>=${this.startId}`;
    } else if (!this.startId && this.endId) {
      return `<=${this.endId}`;
    } else if (this.startId && this.endId) {
      return `${this.startId}..${this.endId}`;
    }
    return '';
  }
}

export class IdRange extends PartialIdRange {
  constructor(idRange: Partial<IdRange>) {
    super(idRange);
  }

  /**
   * Start of the ID range, inclusive.
   */
  @IsInt()
  override startId: number;

  /**
   * End of the ID range, inclusive.
   */
  @IsInt()
  override endId: number;
}

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
export const findIdBounds = <T extends WithId>(
  items: T[] | undefined,
): PartialIdRange =>
  new PartialIdRange({
    startId: findLowestId(items)?.id,
    endId: findHighestId(items)?.id,
  });

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
