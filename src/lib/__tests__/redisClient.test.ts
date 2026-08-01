/**
 * @jest-environment node
 *
 * `@upstash/redis` reaches a `.mjs` dependency that Jest cannot parse under
 * jsdom, so this runs in node like `cache.test.ts` does for the same reason.
 */

import { createRedisClient } from '../redisClient';

// `jest.setup.ts` deletes these globally so no unit test reaches a real Redis;
// each case sets exactly what it needs.
const saved = process.env;

beforeEach(() => {
  process.env = { ...saved };
  delete process.env['UPSTASH_REDIS_REST_URL'];
  delete process.env['UPSTASH_REDIS_REST_TOKEN'];
});

afterEach(() => {
  process.env = saved;
  jest.restoreAllMocks();
});

function setCredentials(url: string, token = 'token'): void {
  process.env['UPSTASH_REDIS_REST_URL'] = url;
  process.env['UPSTASH_REDIS_REST_TOKEN'] = token;
}

describe('createRedisClient', () => {
  it('returns null when neither variable is set, the local-dev path', () => {
    expect(createRedisClient('cache')).toBeNull();
  });

  it('returns null when only the URL is set', () => {
    process.env['UPSTASH_REDIS_REST_URL'] = 'https://example.upstash.io';
    expect(createRedisClient('cache')).toBeNull();
  });

  it('builds a client when the configuration is valid', () => {
    setCredentials('https://example.upstash.io');
    expect(createRedisClient('cache')).not.toBeNull();
  });

  // The production defect: `new Redis()` validates its URL and throws. Both
  // callers build at module scope, so the throw failed the whole Next build
  // while collecting page data for /api/admin/escrow.
  it('falls back to null instead of throwing on a malformed URL', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    setCredentials('not-a-url');

    expect(() => createRedisClient('rateLimit')).not.toThrow();
    expect(createRedisClient('rateLimit')).toBeNull();
  });

  it('rejects a non-https scheme, which Upstash requires', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    setCredentials('redis://example.upstash.io:6379');

    expect(createRedisClient('cache')).toBeNull();
  });

  it('logs the misconfiguration rather than degrading silently', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    setCredentials('not-a-url');

    createRedisClient('rateLimit');

    expect(spy).toHaveBeenCalled();
    expect(JSON.stringify(spy.mock.calls[0])).toContain('rateLimit');
  });
});
