import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set lang attribute for accessibility tests
document.documentElement.lang = 'en';

// Mock fetch for React components tests
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
});
export default {};
