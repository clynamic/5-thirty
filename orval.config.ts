import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: './api.yml',
    },
    output: {
      clean: true,
      workspace: './src/api/e621',
      mode: 'tags',
      target: 'api.ts',
      schemas: 'model',
      client: 'axios-functions',
      urlEncodeParameters: true,
      prettier: true,
      override: {
        useDates: true,
        useNativeEnums: true,
        mutator: {
          path: '../http/axios.ts',
          name: 'makeRequest',
        },
        transformer: (options) => {
          // remove get prefix from operation name
          options = {
            ...options,
            operationName: options.operationName.replace(
              /^get(.)(.*)/,
              (_, firstChar, rest) => firstChar.toLowerCase() + rest,
            ),
          };
          return options;
        },
      },
    },
  },
});
