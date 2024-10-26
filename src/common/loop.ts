import _ from 'lodash';

/**
 * Ensures while loops do not repeat themselves.
 */
export class LoopGuard {
  private previous: unknown | undefined = undefined;

  /**
   * Return the value if it is not the same as the previous value.
   * Otherwise, throw an error.
   */
  public iter<T>(value: T): T {
    if (_.isEqual(this.previous, value)) {
      throw new Error(
        `Infinite loop detected with value: ${JSON.stringify(value, null, 2)}`,
      );
    }
    return (this.previous = value);
  }

  /**
   * Reset the loop.
   */
  public reset(): void {
    this.previous = undefined;
  }
}
