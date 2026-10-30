import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    testTimeout: 15000,
    maxWorkers: 2,
    setupFiles: ['./src/test/setup.ts'],
  },
})
