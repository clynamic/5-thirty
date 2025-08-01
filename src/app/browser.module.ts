import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { Cache, Store } from 'cache-manager';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type ResourceKey = string | Function;

const getResourceKey = (key: ResourceKey): string =>
  typeof key === 'string' ? key : key.name;

@Injectable()
export class CacheManager<S extends Store = Store> implements Cache<S> {
  private static instance: CacheManager;
  private deps = new Map<string, Set<string>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache<S>) {
    CacheManager.instance = this;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      throw new Error('CacheManager instance is not available.');
    }
    return CacheManager.instance;
  }

  /**
   * Link a cache key to a resource key.
   * This allows the cache to be invalidated when the resource changes.
   */
  dep(resourceKey: ResourceKey, cacheKey: string): void {
    const key = getResourceKey(resourceKey);
    if (!this.deps.has(key)) {
      this.deps.set(key, new Set());
    }
    this.deps.get(key)!.add(cacheKey);
  }

  /**
   * Remove the link between a cache key and a resource key.
   */
  undep(resourceKey: ResourceKey, cacheKey: string): void {
    const key = getResourceKey(resourceKey);
    if (this.deps.has(key)) {
      this.deps.get(key)!.delete(cacheKey);
      if (this.deps.get(key)!.size === 0) {
        this.deps.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache keys linked to a resource key.
   */
  async inv(resourceKey: ResourceKey): Promise<void> {
    const key = getResourceKey(resourceKey);
    if (this.deps.has(key)) {
      const cacheKeys = this.deps.get(key)!;
      for (const cacheKey of cacheKeys) {
        await this.del(cacheKey);
      }
      this.deps.delete(key);
    }
  }

  store = this.cacheManager.store;
  /**
   * Set a value in the cache.
   */
  set = this.cacheManager.set;
  /**
   * Get a value from the cache.
   */
  get = this.cacheManager.get;
  /**
   * Delete a value from the cache.
   */
  del = this.cacheManager.del;
  /**
   * Reset the cache.
   */
  reset = this.cacheManager.reset;
  /**
   * Listen for cache events.
   */
  on = this.cacheManager.on;
  /**
   * Remove a listener for cache events.
   */
  removeListener = this.cacheManager.removeListener;
  /**
   * Wrap a function with caching.
   */
  wrap = this.cacheManager.wrap;
}

export interface CacheableOptions {
  ttl?: number;
  dependencies?: ResourceKey[];
  disable?: boolean;
}

export function Cacheable<TArgs extends any[], TReturn>(
  keyFn: (...args: TArgs) => string,
  options?: CacheableOptions,
): MethodDecorator {
  return function (_, __, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (
      ...args: TArgs
    ) => Promise<TReturn>;

    descriptor.value = async function (...args: TArgs) {
      const cacheManager = CacheManager.getInstance();
      const cacheKey = keyFn(...args);

      if (options?.dependencies) {
        options?.dependencies.forEach((dep) => {
          const resourceKey = typeof dep === 'string' ? dep : dep.name;
          cacheManager.dep(resourceKey, cacheKey);
        });
      }

      if (options?.disable) {
        return originalMethod.apply(this, args);
      }

      return cacheManager.wrap(
        cacheKey,
        () => originalMethod.apply(this, args),
        options?.ttl,
      );
    };

    return descriptor;
  };
}

export function Invalidates(
  resourceKeys: ResourceKey | ResourceKey[],
): MethodDecorator {
  return function (_, __, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: any[]) => Promise<any>;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = CacheManager.getInstance();

      try {
        const result = await originalMethod.apply(this, args);
        const keys = Array.isArray(resourceKeys)
          ? resourceKeys
          : [resourceKeys];

        for (const resourceKey of keys) {
          await cacheManager.inv(resourceKey);
        }

        return result;
      } catch (error) {
        throw error;
      }
    };

    return descriptor;
  };
}

export function withInvalidation<T extends (...args: any[]) => any>(
  fn: T,
  resourceKeys: ResourceKey | ResourceKey[],
): T {
  return (async (...args: any[]) => {
    const cacheManager = CacheManager.getInstance();

    try {
      const result = await fn(...args);
      const keys = Array.isArray(resourceKeys) ? resourceKeys : [resourceKeys];

      for (const entityType of keys) {
        await cacheManager.inv(entityType);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }) as T;
}

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 5 * 60 * 1000,
    }),
  ],
  providers: [CacheManager],
  exports: [CacheManager],
})
export class BrowserModule {}
