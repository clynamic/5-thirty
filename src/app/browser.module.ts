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

  dep(resourceKey: ResourceKey, cacheKey: string): void {
    const key = getResourceKey(resourceKey);
    if (!this.deps.has(key)) {
      this.deps.set(key, new Set());
    }
    this.deps.get(key)!.add(cacheKey);
  }

  undep(resourceKey: ResourceKey, cacheKey: string): void {
    const key = getResourceKey(resourceKey);
    if (this.deps.has(key)) {
      this.deps.get(key)!.delete(cacheKey);
      if (this.deps.get(key)!.size === 0) {
        this.deps.delete(key);
      }
    }
  }

  async delDep(resourceKey: ResourceKey): Promise<void> {
    const key = getResourceKey(resourceKey);
    if (this.deps.has(key)) {
      const cacheKeys = this.deps.get(key)!;
      for (const cacheKey of cacheKeys) {
        await this.cacheManager.del(cacheKey);
      }
      this.deps.delete(key);
    }
  }

  store = this.cacheManager.store;
  set = this.cacheManager.set;
  get = this.cacheManager.get;
  del = this.cacheManager.del;
  reset = this.cacheManager.reset;
  on = this.cacheManager.on;
  removeListener = this.cacheManager.removeListener;
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
          await cacheManager.delDep(resourceKey);
        }

        return result;
      } catch (error) {
        throw error;
      }
    };

    return descriptor;
  };
}

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 5 * 60 * 1000,
    }),
  ],
  controllers: [],
  providers: [CacheManager],
  exports: [CacheManager],
})
export class BrowserModule {}
