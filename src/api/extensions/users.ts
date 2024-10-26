import { chunk } from 'lodash';
import { rateLimit } from 'src/common';

import { User, users } from '../e621';

export const usersMany = async (
  ids: number[],
  axiosConfig?: Parameters<typeof users>[1],
  onResult?: (result: User[]) => Promise<void> | void,
): Promise<User[]> => {
  const results: User[] = [];

  const limit = 100; // API allows up to 100
  const chunks = chunk(ids, limit);

  for (const chunk of chunks) {
    const result = await rateLimit(
      users(
        {
          page: 1,
          limit,
          'search[id]': chunk.join(','),
        },
        axiosConfig,
      ),
    );

    results.push(...result);

    await onResult?.(result);
  }

  return results;
};
