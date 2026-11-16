import { defineConfig, defineTransformer } from 'orval'

const forceAvatarBlob = defineTransformer((spec) => {
  const ok = spec.paths?.['/v1/users/me/avatar']?.get?.responses?.['200']
  if (ok && typeof ok !== 'string' && !('$ref' in ok)) {
    ok.content = {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    }
  }
  return spec
})

export default defineConfig({
  crossfitbuddy: {
    input: {
      target: 'http://localhost:8080/api/v3/api-docs',
      override: { transformer: forceAvatarBlob },
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
        },
      },
    },
  },
})
