import { z } from 'zod';
import type { TaskPriority, IdeaCategory } from '../../types/event';

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
  overview: z.string().default('An unforgettable celebration tailored to your vision.'),
  themeDirection: z.string().default('Classic & Joyful atmosphere with coordinated details.'),
  suggestedActivities: z.array(z.string()).default([]),
  budgetAllocations: z
    .array(
      z
        .object({
          categoryKey: z.string().default('miscellaneous'),
          name: z.string().optional(),
          category: z.string().optional(),
          title: z.string().optional(),
          percentage: z.coerce.number().default(10),
          allocatedAmount: z.coerce.number().default(0),
        })
        .transform((item) => ({
          categoryKey: item.categoryKey || item.category || 'miscellaneous',
          name: item.name || item.title || item.category || 'General',
          percentage: Math.max(0, Math.min(100, item.percentage)),
          allocatedAmount: Math.max(0, item.allocatedAmount),
        }))
    )
    .default([]),
  suggestedExpenses: z
    .array(
      z
        .object({
          categoryKey: z.string().optional(),
          title: z.string().optional(),
          name: z.string().optional(),
          item: z.string().optional(),
          description: z.string().optional(),
          estimatedCost: z.coerce.number().default(0),
          cost: z.coerce.number().optional(),
          amount: z.coerce.number().optional(),
        })
        .transform((exp) => ({
          categoryKey: exp.categoryKey || 'miscellaneous',
          title: exp.title || exp.name || exp.item || exp.description || 'Estimated Expense',
          estimatedCost: Math.max(0, exp.estimatedCost || exp.cost || exp.amount || 0),
        }))
    )
    .default([]),
  tasks: z
    .array(
      z
        .object({
          title: z.string().optional(),
          name: z.string().optional(),
          task: z.string().optional(),
          description: z.string().default(''),
          category: z.string().default('General'),
          daysBeforeEvent: z.coerce.number().default(7),
          daysBefore: z.coerce.number().optional(),
          priority: z.string().optional(),
        })
        .transform((t) => {
          const rawPriority = (t.priority || 'medium').toLowerCase();
          const validPriority: TaskPriority = ['low', 'medium', 'high', 'urgent'].includes(rawPriority)
            ? (rawPriority as TaskPriority)
            : 'medium';
          return {
            title: t.title || t.name || t.task || 'Planning milestone',
            description: t.description || '',
            category: t.category || 'General',
            daysBeforeEvent: typeof t.daysBeforeEvent === 'number' ? t.daysBeforeEvent : (t.daysBefore ?? 7),
            priority: validPriority,
          };
        })
    )
    .default([]),
  vendorCriteria: z
    .array(
      z
        .object({
          category: z.string().default('General'),
          criteria: z.string().default(''),
          description: z.string().optional(),
        })
        .transform((v) => ({
          category: v.category || 'General',
          criteria: v.criteria || v.description || 'Standard quality check',
        }))
    )
    .default([]),
  ideas: z
    .array(
      z
        .object({
          category: z.string().optional(),
          title: z.string().optional(),
          name: z.string().optional(),
          description: z.string().default(''),
          tags: z.array(z.string()).optional(),
        })
        .transform((i) => {
          const rawCat = (i.category || 'theme').toLowerCase();
          const validCategory: IdeaCategory = [
            'theme',
            'food',
            'activity',
            'invitation',
            'entertainment',
            'budget_friendly',
            'accessibility',
            'weather',
          ].includes(rawCat)
            ? (rawCat as IdeaCategory)
            : 'theme';
          return {
            category: validCategory,
            title: i.title || i.name || 'Creative Idea',
            description: i.description || '',
            tags: i.tags || [],
          };
        })
    )
    .default([]),
  risksAndContingencies: z.array(z.string()).default([]),
  assumptionsAndQuestions: z.array(z.string()).default([]),
});
