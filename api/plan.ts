import { planGenerationRequestSchema } from '../src/lib/validation/schemas';
import { checkRateLimit } from './_lib/rate-limit';
import { generatePlanWithGemini, getGeminiApiKey, getGeminiModel } from './_lib/gemini';
import { ApiErrorResponse, PlanGenerationResponse } from '../src/types/api';

// Maximum payload size (50 KB is ample for event parameters + notes)
const MAX_PAYLOAD_BYTES = 50 * 1024;

interface ServerlessRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  setHeader: (name: string, value: string) => ServerlessResponse;
  json: (data: unknown) => void;
  end?: (data?: string) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // Enforce Content-Type & Security Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 1. Enforce POST only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      error: `HTTP method ${req.method || 'UNKNOWN'} is not allowed. Please use POST.`,
    } as ApiErrorResponse);
  }

  // 2. Client IP Rate Limiting
  const forwarded = req.headers?.['x-forwarded-for'];
  const clientIp =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : Array.isArray(forwarded) ? forwarded[0] : null) ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    '127.0.0.1';

  const rateLimitResult = checkRateLimit(clientIp, 15, 60 * 1000); // 15 requests/minute
  res.setHeader('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetInMs / 1000)));

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      error: 'Too many plan generation requests from your IP. Please wait a minute before trying again.',
    } as ApiErrorResponse);
  }

  // 3. Payload size and presence check
  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({
        success: false,
        code: 'PAYLOAD_TOO_LARGE',
        error: 'Request payload exceeds maximum allowed size (50 KB).',
      } as ApiErrorResponse);
    }
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        success: false,
        code: 'INVALID_JSON',
        error: 'Malformed JSON payload provided in request body.',
      } as ApiErrorResponse);
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      code: 'EMPTY_BODY',
      error: 'Request body must be a JSON object containing event parameters.',
    } as ApiErrorResponse);
  }

  // 4. Validate request parameters using Zod
  const validationResult = planGenerationRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const formattedErrors: Record<string, string[]> = {};
    validationResult.error.errors.forEach((err) => {
      const field = err.path.join('.') || 'general';
      if (!formattedErrors[field]) formattedErrors[field] = [];
      formattedErrors[field]?.push(err.message);
    });

    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      error: 'Event planning parameters failed validation.',
      details: formattedErrors,
    } as ApiErrorResponse);
  }

  const validReq = validationResult.data;

  // 5. Check Server Environment configuration for Gemini API Key
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      code: 'MISSING_API_KEY',
      error:
        'The Gemini AI planning service requires server-side configuration. GEMINI_API_KEY environment variable is not configured on this deployment. Local planning tools remain available.',
    } as ApiErrorResponse);
  }

  const model = getGeminiModel();

  // 6. Invoke Gemini with bounded prompt and timeout
  try {
    const plan: PlanGenerationResponse = await Promise.race([
      generatePlanWithGemini(validReq, apiKey, model),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation request timed out after 35 seconds.')), 35000)
      ),
    ]);

    return res.status(200).json(plan);
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : 'Unknown generation error';
    console.error('[Planora API /api/plan] Generation error:', rawMessage);

    // Sanitize error message to ensure no secrets or sensitive keys are leaked
    let safeMessage = 'An unexpected error occurred during AI plan generation.';
    let statusCode = 500;
    let errorCode = 'GENERATION_FAILED';

    if (rawMessage.includes('timed out')) {
      safeMessage = 'The AI planning service took too long to respond. Please try again.';
      statusCode = 504;
      errorCode = 'TIMEOUT';
    } else if (rawMessage.includes('quota') || rawMessage.includes('ResourceExhausted') || rawMessage.includes('429')) {
      safeMessage = 'Google Gemini API quota or rate limit reached. Please verify your Google AI Studio quota.';
      statusCode = 429;
      errorCode = 'QUOTA_EXCEEDED';
    } else if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('unauthorized') || rawMessage.includes('403')) {
      safeMessage = 'Google Gemini API authentication failed. Please verify that GEMINI_API_KEY is active and valid.';
      statusCode = 502;
      errorCode = 'AUTHENTICATION_FAILED';
    } else if (rawMessage.includes('schema validation')) {
      safeMessage = 'The AI model returned an incomplete or unexpected response structure. Please retry.';
      statusCode = 502;
      errorCode = 'MALFORMED_AI_OUTPUT';
    }

    return res.status(statusCode).json({
      success: false,
      code: errorCode,
      error: safeMessage,
    } as ApiErrorResponse);
  }
}
