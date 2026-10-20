import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/plan';
import { checkRateLimit } from '../api/_lib/rate-limit';

function createMockReqRes(method: string = 'POST', body: unknown = {}, ip: string = '127.0.0.1') {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let responseData: any = null;

  const req = {
    method,
    headers: {
      'x-forwarded-for': ip,
    },
    body,
  };

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(key: string, value: string) {
      headers[key] = value;
      return this;
    },
    json(data: unknown) {
      responseData = data;
    },
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getData: () => responseData,
  };

  return { req, res };
}

describe('Serverless API Endpoint /api/plan', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);

    expect(res.getStatusCode()).toBe(405);
    expect(res.getHeaders()['Allow']).toBe('POST');
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('METHOD_NOT_ALLOWED');
  });

  it('rejects invalid or missing request parameters with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', {
      name: '', // Invalid: min 2
      type: 'invalid_type',
    });

    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('VALIDATION_FAILED');
    expect(res.getData().details).toBeDefined();
  });

  it('returns 503 Service Unavailable with clear message when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;

    const { req, res } = createMockReqRes('POST', {
      name: 'Sahil 30th Birthday',
      type: 'birthday',
      date: '2026-11-20',
      location: 'Bangalore',
      guestCount: 30,
      totalBudget: 40000,
      currency: 'INR',
    });

    await handler(req, res);

    expect(res.getStatusCode()).toBe(503);
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('MISSING_API_KEY');
    expect(res.getData().error).toContain('GEMINI_API_KEY');
    // Ensure no secrets or internal paths leaked
    expect(JSON.stringify(res.getData())).not.toContain('stack');
  });

  it('enforces rate limiting when multiple rapid requests are sent from the same IP', async () => {
    const ip = '198.51.100.42';

    // Simulate 20 rapid requests to trigger rate limiter (limit is 15)
    let rateLimited = false;
    for (let i = 0; i < 20; i++) {
      const { req, res } = createMockReqRes(
        'POST',
        {
          name: 'Test Event',
          type: 'wedding',
          date: '2026-12-01',
          location: 'Delhi',
          guestCount: 50,
          totalBudget: 100000,
        },
        ip
      );

      await handler(req, res);
      if (res.getStatusCode() === 429) {
        rateLimited = true;
        expect(res.getData().code).toBe('RATE_LIMIT_EXCEEDED');
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });
});
