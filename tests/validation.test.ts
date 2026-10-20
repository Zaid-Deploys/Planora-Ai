import { describe, it, expect } from 'vitest';
import {
  planGenerationRequestSchema,
  isValidHttpUrl,
  safeUrlSchema,
} from '../src/lib/validation/schemas';

describe('Event & API Input Validation Schemas', () => {
  it('validates a complete, well-formed event request successfully', () => {
    const validData = {
      name: 'Maya & Leo Wedding',
      type: 'wedding',
      date: '2026-12-25',
      location: 'Udaipur, Rajasthan',
      guestCount: 150,
      totalBudget: 1500000,
      currency: 'INR',
      setting: 'outdoor',
      theme: 'Royal Palace Heritage',
      dietaryRequirements: 'Vegetarian and Jain options available',
      accessibilityNeeds: 'Wheelchair access ramp for elderly grandparents',
      planningPriorities: 'Focus on photography and traditional banquet',
      notes: 'Evening fireworks permit secured',
    };

    const result = planGenerationRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects payloads missing required fields', () => {
    const missingData = {
      name: '',
      type: 'birthday',
      location: '',
      guestCount: 0,
      totalBudget: -500,
    };

    const result = planGenerationRequestSchema.safeParse(missingData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorPaths = result.error.errors.map((e) => e.path[0]);
      expect(errorPaths).toContain('name');
      expect(errorPaths).toContain('date');
      expect(errorPaths).toContain('location');
      expect(errorPaths).toContain('guestCount');
      expect(errorPaths).toContain('totalBudget');
    }
  });

  it('rejects invalid date formats', () => {
    const invalidDate = {
      name: 'Birthday Party',
      type: 'birthday',
      date: '25-12-2026', // Not YYYY-MM-DD
      location: 'Mumbai',
      guestCount: 25,
      totalBudget: 25000,
    };

    const result = planGenerationRequestSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative guest count', () => {
    const zeroGuests = {
      name: 'Anniversary',
      type: 'anniversary',
      date: '2026-11-15',
      location: 'Goa',
      guestCount: 0,
      totalBudget: 50000,
    };

    const result = planGenerationRequestSchema.safeParse(zeroGuests);
    expect(result.success).toBe(false);
  });

  it('strictly validates safe URL schemes and blocks XSS payloads', () => {
    expect(isValidHttpUrl('https://royalpalace.com')).toBe(true);
    expect(isValidHttpUrl('http://vendors.example.in/profile')).toBe(true);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
    expect(isValidHttpUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('not-a-valid-url')).toBe(false);

    // safeUrlSchema verification
    expect(safeUrlSchema.safeParse('https://example.com').success).toBe(true);
    expect(safeUrlSchema.safeParse('').success).toBe(true);
    expect(safeUrlSchema.safeParse('javascript:void(0)').success).toBe(false);
  });
});
