import { z } from 'zod';

export const eventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'graduation',
  'other',
]);

export const eventSettingSchema = z.enum(['indoor', 'outdoor', 'mixed']);

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const vendorStatusSchema = z.enum([
  'inquired',
  'contacted',
  'shortlisted',
  'booked',
  'declined',
]);

export const ideaCategorySchema = z.enum([
  'theme',
  'food',
  'activity',
  'invitation',
  'entertainment',
  'budget_friendly',
  'accessibility',
  'weather',
]);

// Security: strictly validate URLs to prevent javascript: or data: XSS vectors
export function isValidHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || isValidHttpUrl(val),
    { message: 'URL must begin with http:// or https://' }
  )
  .optional()
  .or(z.literal(''));

export const planGenerationRequestSchema = z.object({
  name: z.string().trim().min(2, 'Event name must be at least 2 characters').max(120, 'Event name is too long'),
  type: eventTypeSchema,
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  startTime: z.string().trim().max(20).optional().or(z.literal('')),
  endTime: z.string().trim().max(20).optional().or(z.literal('')),
  location: z.string().trim().min(2, 'Location is required').max(150, 'Location is too long'),
  guestCount: z.coerce.number().int('Guest count must be an integer').min(1, 'Guest count must be at least 1').max(100000, 'Guest count exceeds reasonable limit'),
  totalBudget: z.coerce.number().positive('Budget must be greater than zero').max(1000000000, 'Budget exceeds limit'),
  currency: z.string().trim().min(3).max(4).default('INR'),
  setting: eventSettingSchema.optional(),
  theme: z.string().trim().max(150).optional().or(z.literal('')),
  colorPreferences: z.string().trim().max(150).optional().or(z.literal('')),
  dietaryRequirements: z.string().trim().max(500).optional().or(z.literal('')),
  culturalTraditions: z.string().trim().max(500).optional().or(z.literal('')),
  accessibilityNeeds: z.string().trim().max(500).optional().or(z.literal('')),
  planningPriorities: z.string().trim().max(500).optional().or(z.literal('')),
  preferredLanguage: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(1500, 'Notes cannot exceed 1500 characters').optional().or(z.literal('')),
});

export const generatedPlanSchema = z.object({
  overview: z.string().min(10),
  themeDirection: z.string().min(5),
  suggestedActivities: z.array(z.string()).min(1),
  budgetAllocations: z.array(
    z.object({
      categoryKey: z.string(),
      name: z.string(),
      percentage: z.number().min(0).max(100),
      allocatedAmount: z.number().nonnegative(),
    })
  ).min(3),
  suggestedExpenses: z.array(
    z.object({
      categoryKey: z.string(),
      title: z.string(),
      estimatedCost: z.number().nonnegative(),
    })
  ).default([]),
  tasks: z.array(
    z.object({
      title: z.string().min(3),
      description: z.string().default(''),
      category: z.string(),
      daysBeforeEvent: z.number().int(),
      priority: taskPrioritySchema,
    })
  ).min(3),
  vendorCriteria: z.array(
    z.object({
      category: z.string(),
      criteria: z.string(),
    })
  ).default([]),
  ideas: z.array(
    z.object({
      category: ideaCategorySchema,
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ).default([]),
  risksAndContingencies: z.array(z.string()).default([]),
  assumptionsAndQuestions: z.array(z.string()).default([]),
});
