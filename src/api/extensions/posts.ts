import { chunk } from 'lodash';
import { rateLimit } from 'src/common';

import { Post, posts } from '../e621';

export const postsMany = async (
  ids: number[],
  axiosConfig?: Parameters<typeof posts>[1],
  onResult?: (result: Post[]) => Promise<void> | void,
): Promise<Post[]> => {
  const results: Post[] = [];

  const limit = 40; // API allows up to 40
  const chunks = chunk(ids, limit);

  for (const chunk of chunks) {
    const result = await rateLimit(
      posts(
        {
          page: 1,
          limit,
          tags: `id:${chunk.join(',')}`,
        },
        axiosConfig,
      ),
    );

    results.push(...result);

    await onResult?.(result);
  }

  return results;
};
