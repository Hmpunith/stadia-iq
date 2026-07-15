import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'server/constants.js',
        'server/errors.js',
        'server/schemas.js',
        'server/prompts.js',
        'server/db.js',
        'src/constants.js'
      ],
      thresholds: {},
    },
  },
});
