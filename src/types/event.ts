export type EventType =
  | 'wedding'
  | 'birthday'
  | 'community'
  | 'anniversary'
  | 'graduation'
  | 'other';

export type EventSetting = 'indoor' | 'outdoor' | 'mixed';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 0 },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', decimals: 0 },
};

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  isAiGenerated?: boolean;
}

export interface BudgetCategoryAllocation {
  id: string;
  categoryKey: string;
  name: string;
  percentage: number; // e.g. 20 for 20%
  allocatedAmount: number;
}

export interface ExpenseItem {
  id: string;
  categoryKey: string;
  title: string;
  estimatedCost: number;
  actualCost: number;
  vendorId?: string;
  paid: boolean;
  notes?: string;
}

export type VendorStatus =
  | 'inquired'
  | 'contacted'
  | 'shortlisted'
  | 'booked'
  | 'declined';

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  quotedPrice?: number;
  status: VendorStatus;
  notes?: string;
  linkedCategoryKey?: string;
}

export type IdeaCategory =
  | 'theme'
  | 'food'
  | 'activity'
  | 'invitation'
  | 'entertainment'
  | 'budget_friendly'
  | 'accessibility'
  | 'weather';

export interface IdeaItem {
  id: string;
  category: IdeaCategory;
  title: string;
  description: string;
  tags?: string[];
  saved: boolean;
}

export interface EventPlan {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
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

  // AI-generated contextual fields
  overview?: string;
  themeDirection?: string;
  suggestedActivities?: string[];
  vendorCriteria?: { category: string; criteria: string }[];
  risksAndContingencies?: string[];
  assumptionsAndQuestions?: string[];
  isAiGenerated?: boolean;
  aiModel?: string;

  // Related domain datasets
  categoryAllocations: BudgetCategoryAllocation[];
  expenses: ExpenseItem[];
  tasks: TaskItem[];
  vendors: VendorItem[];
  ideas: IdeaItem[];

  createdAt: string;
  updatedAt: string;
}

export interface StoredAppState {
  version: number;
  events: EventPlan[];
  activeEventId: string | null;
  lastUpdated: string;
}
