import { EventType, EventSetting } from './event';

export interface PlanGenerationRequest {
  name: string;
  type: EventType;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  setting?: EventSetting;
  theme?: string;
  colorPreferences?: string;
  dietaryRequirements?: string;
  culturalTraditions?: string;
  accessibilityNeeds?: string;
  planningPriorities?: string;
  preferredLanguage?: string;
  notes?: string;
}

export interface GeneratedBudgetCategory {
  categoryKey: string;
  name: string;
  percentage: number;
  allocatedAmount: number;
}

export interface GeneratedExpenseItem {
  categoryKey: string;
  title: string;
  estimatedCost: number;
}

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  daysBeforeEvent: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface GeneratedVendorCategory {
  category: string;
  criteria: string;
}

export interface GeneratedIdea {
  category: 'theme' | 'food' | 'activity' | 'invitation' | 'entertainment' | 'budget_friendly' | 'accessibility' | 'weather';
  title: string;
  description: string;
  tags?: string[];
}

export interface PlanGenerationResponse {
  success: boolean;
  model: string;
  overview: string;
  themeDirection: string;
  suggestedActivities: string[];
  budgetAllocations: GeneratedBudgetCategory[];
  suggestedExpenses: GeneratedExpenseItem[];
  tasks: GeneratedTask[];
  vendorCriteria: GeneratedVendorCategory[];
  ideas: GeneratedIdea[];
  risksAndContingencies: string[];
  assumptionsAndQuestions: string[];
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
