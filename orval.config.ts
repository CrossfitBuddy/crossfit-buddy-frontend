import { defineConfig } from 'orval'

export default defineConfig({
  crossfitbuddy: {
    input: {
      target: 'http://localhost:8080/v3/api-docs',
    },
    output: {
      mode: 'split',
      target: './src/api/generated/crossfit-buddy.ts',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/http.ts',
          name: 'customInstance',
        },
        query: {
          version: 5,
          useQuery: true,
        },
      },
    },
  },
})
