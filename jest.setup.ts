// Load .env.test before any module is imported
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Silence the Winston logger during tests — keeps output clean
jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

// Silence Sentry during tests — we don't want real events sent
jest.mock('@/lib/sentry', () => ({
  captureError: jest.fn(),
  captureWarning: jest.fn(),
}));

// Silence metrics during tests
jest.mock('@/lib/metrics', () => ({
  recordRequest: jest.fn(),
  recordUpload: jest.fn(),
  recordDelete: jest.fn(),
  getMetrics: jest.fn(() => ({})),
}));
