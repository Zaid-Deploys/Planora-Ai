import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, { clearRateLimitCache } from '../api/plan';

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

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
    mockGenerateContent.mockReset();
    clearRateLimitCache();
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
        expect(res.getHeaders()['X-RateLimit-Remaining']).toBe('0');
        expect(res.getHeaders()['X-RateLimit-Reset']).toBeDefined();
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });

  it('rejects oversized payloads exceeding 50 KB with 413 Payload Too Large', async () => {
    // Generate a payload string larger than 50 KB (50 * 1024 bytes)
    const giantNotes = 'A'.repeat(55 * 1024);
    const oversizedBodyString = JSON.stringify({
      name: 'Oversized Event',
      type: 'wedding',
      date: '2026-12-01',
      location: 'Goa',
      guestCount: 50,
      totalBudget: 100000,
      notes: giantNotes,
    });

    const { req, res } = createMockReqRes('POST', oversizedBodyString);
    await handler(req, res);

    expect(res.getStatusCode()).toBe(413);
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects malformed stringified JSON payloads with 400 Invalid JSON', async () => {
    const { req, res } = createMockReqRes('POST', '{ not-valid-json: true ');
    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('INVALID_JSON');
  });

  it('rejects empty or non-object bodies with 400 Empty Body', async () => {
    const { req, res } = createMockReqRes('POST', null);
    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getData().success).toBe(false);
    expect(res.getData().code).toBe('EMPTY_BODY');
  });

  it('resets rate limiting on the production instance when clearRateLimitCache is called', async () => {
    const testIp = '203.0.113.88';
    const sampleEvent = {
      name: 'Rate Limit Test',
      type: 'birthday',
      date: '2026-12-01',
      location: 'Mumbai',
      guestCount: 25,
      totalBudget: 50000,
    };

    // Consume all 15 requests
    for (let i = 0; i < 15; i++) {
      const { req, res } = createMockReqRes('POST', sampleEvent, testIp);
      await handler(req, res);
      expect(res.getStatusCode()).not.toBe(429);
    }

    // 16th request must be rejected with 429
    const { req: reqBlocked, res: resBlocked } = createMockReqRes('POST', sampleEvent, testIp);
    await handler(reqBlocked, resBlocked);
    expect(resBlocked.getStatusCode()).toBe(429);
    expect(resBlocked.getData().code).toBe('RATE_LIMIT_EXCEEDED');

    // Call production cache cleanup
    clearRateLimitCache();

    // 17th request must now bypass rate limiting (503 because no API key)
    const { req: reqAfterClear, res: resAfterClear } = createMockReqRes('POST', sampleEvent, testIp);
    await handler(reqAfterClear, resAfterClear);
    expect(resAfterClear.getStatusCode()).toBe(503);
    expect(resAfterClear.getData().code).toBe('MISSING_API_KEY');
  });

  describe('Production Handler Gemini AI Integration', () => {
    const validMockPlan = {
      overview: 'A wonderful celebration planned with attention to detail and care.',
      themeDirection: 'Vibrant and elegant with golden accents.',
      suggestedActivities: ['Welcome drinks', 'Live acoustic set', 'Cake cutting ceremony'],
      budgetAllocations: [
        { categoryKey: 'venue', name: 'Venue & Facilities', percentage: 50, allocatedAmount: 50000 },
        { categoryKey: 'catering', name: 'Food & Catering', percentage: 50, allocatedAmount: 50000 },
      ],
      suggestedExpenses: [
        { categoryKey: 'venue', title: 'Main banquet hall rental', estimatedCost: 45000 },
        { categoryKey: 'catering', title: 'Buffet dinner for 50', estimatedCost: 40000 },
      ],
      tasks: [
        {
          title: 'Book venue banquet hall',
          description: 'Confirm hall availability and pay deposit',
          category: 'venue',
          daysBeforeEvent: 60,
          priority: 'urgent',
        },
      ],
      vendorCriteria: [
        { category: 'venue', criteria: 'Check capacity, cancellation policy and parking.' },
      ],
      ideas: [
        { category: 'theme', title: 'Golden Sparkle', description: 'Fairy lights and golden centerpieces', tags: ['decor', 'lighting'] },
      ],
      risksAndContingencies: ['Indoor backup room reserved in case of rain.'],
      assumptionsAndQuestions: ['Confirm final guest count 14 days prior.'],
    };

    it('returns HTTP 200 with structured plan on successful Gemini generation', async () => {
      process.env.GEMINI_API_KEY = 'fake-test-api-key';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(validMockPlan),
        },
      });

      const { req, res } = createMockReqRes('POST', {
        name: 'Grand Wedding Celebration',
        type: 'wedding',
        date: '2026-12-15',
        location: 'Udaipur',
        guestCount: 150,
        totalBudget: 500000,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.overview).toContain('celebration');
      expect(data.tasks.length).toBeGreaterThan(0);
      expect(data.budgetAllocations.length).toBe(2);
    });

    it('reconciles budget allocations to exactly match totalBudget and 100% distribution', async () => {
      process.env.GEMINI_API_KEY = 'fake-test-api-key';
      const planWithFractionalBudget = {
        ...validMockPlan,
        budgetAllocations: [
          { categoryKey: 'venue', name: 'Venue', percentage: 33.3, allocatedAmount: 33333 },
          { categoryKey: 'catering', name: 'Catering', percentage: 33.3, allocatedAmount: 33333 },
          { categoryKey: 'decor', name: 'Decor', percentage: 33.4, allocatedAmount: 33334 },
        ],
      };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(planWithFractionalBudget),
        },
      });

      const totalBudget = 100000;
      const { req, res } = createMockReqRes('POST', {
        name: 'Reconciled Anniversary',
        type: 'anniversary',
        date: '2026-11-20',
        location: 'Pune',
        guestCount: 50,
        totalBudget,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      const sumPercent = data.budgetAllocations.reduce((acc: number, a: any) => acc + a.percentage, 0);
      const sumAmount = data.budgetAllocations.reduce((acc: number, a: any) => acc + a.allocatedAmount, 0);

      expect(Math.round(sumPercent * 10) / 10).toBe(100);
      expect(sumAmount).toBe(totalBudget);
    });

    it('returns HTTP 504 TIMEOUT when generation exceeds timeout threshold', async () => {
      process.env.GEMINI_API_KEY = 'fake-test-api-key';
      mockGenerateContent.mockRejectedValue(new Error('AI generation request timed out after 25 seconds.'));

      const { req, res } = createMockReqRes('POST', {
        name: 'Timeout Test',
        type: 'birthday',
        date: '2026-12-01',
        location: 'Delhi',
        guestCount: 20,
        totalBudget: 30000,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(504);
      expect(res.getData().success).toBe(false);
      expect(res.getData().code).toBe('TIMEOUT');
      expect(res.getData().error).toContain('took too long');
    });

    it('returns HTTP 429 QUOTA_EXCEEDED when Gemini API quota is exhausted', async () => {
      process.env.GEMINI_API_KEY = 'fake-test-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('ResourceExhausted: 429 Quota exceeded for quota metric'));

      const { req, res } = createMockReqRes('POST', {
        name: 'Quota Test',
        type: 'community',
        date: '2026-12-01',
        location: 'Jaipur',
        guestCount: 100,
        totalBudget: 80000,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(429);
      expect(res.getData().success).toBe(false);
      expect(res.getData().code).toBe('QUOTA_EXCEEDED');
      expect(res.getData().error).toContain('quota');
    });

    it('returns HTTP 502 AUTHENTICATION_FAILED when GEMINI_API_KEY is invalid or unauthorized', async () => {
      process.env.GEMINI_API_KEY = 'invalid-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('API_KEY_INVALID: API key not valid. Please pass a valid API key.'));

      const { req, res } = createMockReqRes('POST', {
        name: 'Auth Test',
        type: 'wedding',
        date: '2026-12-01',
        location: 'Kolkata',
        guestCount: 80,
        totalBudget: 200000,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(502);
      expect(res.getData().success).toBe(false);
      expect(res.getData().code).toBe('AUTHENTICATION_FAILED');
      expect(res.getData().error).toContain('authentication failed');
    });

    it('returns HTTP 502 MALFORMED_AI_OUTPUT when model JSON fails schema validation', async () => {
      process.env.GEMINI_API_KEY = 'fake-test-api-key';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '12345', // Fails object schema validation
        },
      });

      const { req, res } = createMockReqRes('POST', {
        name: 'Malformed Test',
        type: 'birthday',
        date: '2026-12-01',
        location: 'Chennai',
        guestCount: 15,
        totalBudget: 15000,
      });

      await handler(req, res);

      expect(res.getStatusCode()).toBe(502);
      expect(res.getData().success).toBe(false);
      expect(res.getData().code).toBe('MALFORMED_AI_OUTPUT');
      expect(res.getData().error).toContain('incomplete or unexpected');
    });
  });
});
