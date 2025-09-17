import { TZDate } from '@date-fns/tz';
import { startOfDay } from 'date-fns';

import { SHIP_TIMEZONE } from './timezone';

/**
 * Creates a seeded random number generator using a simple linear congruential approach
 * @param seed - The seed value for the random number generator
 * @returns A function that returns deterministic random numbers between 0 and 1
 */
export const createSeededRandom = (seed: number): (() => number) => {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
};

/**
 * Gets a deterministic seed based on the current date
 * This ensures the same seed is used for an entire day
 * @returns A seed number based on the current date
 */
export const getDailySeed = (date: Date = TZDate.tz(SHIP_TIMEZONE)): number => {
  const today = startOfDay(date);
  return Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
};
