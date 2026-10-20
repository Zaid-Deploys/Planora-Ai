import { BudgetCategoryAllocation, ExpenseItem, SUPPORTED_CURRENCIES } from '../../types/event';

export interface BudgetSummary {
  totalBudget: number;
  totalPlannedAllocations: number;
  totalEstimatedExpenses: number;
  totalActualExpenses: number;
  remainingBudget: number;
  unallocatedFunds: number;
  isOverBudget: boolean;
  isAllocationsOverBudget: boolean;
  actualUtilizationPercentage: number;
  plannedUtilizationPercentage: number;
}

export interface CategorySummary {
  categoryKey: string;
  name: string;
  allocatedAmount: number;
  allocatedPercentage: number;
  estimatedCost: number;
  actualCost: number;
  itemCount: number;
  isOverAllocated: boolean;
  remainingInCategory: number;
}

export const DEFAULT_BUDGET_CATEGORIES = [
  { key: 'venue', name: 'Venue & Facilities', defaultPercent: 30 },
  { key: 'catering', name: 'Food & Catering', defaultPercent: 25 },
  { key: 'decor', name: 'Decorations & Flowers', defaultPercent: 12 },
  { key: 'photography', name: 'Photography & Video', defaultPercent: 10 },
  { key: 'entertainment', name: 'Music & Entertainment', defaultPercent: 8 },
  { key: 'attire', name: 'Attire & Beauty', defaultPercent: 5 },
  { key: 'invitations', name: 'Invitations & Favors', defaultPercent: 2 },
  { key: 'transport', name: 'Transport & Logistics', defaultPercent: 3 },
  { key: 'contingency', name: 'Emergency Contingency', defaultPercent: 5 },
];

/**
 * Money calculations using safe integer arithmetic (minor units) to prevent floating-point drift.
 */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Formats a currency amount with localized separators.
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const fallback = SUPPORTED_CURRENCIES.INR ?? { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 0 };
  const config = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] ?? fallback;
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  try {
    const locale = currencyCode.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: config.decimals,
      minimumFractionDigits: config.decimals,
    }).format(safeAmount);
  } catch {
    return `${config.symbol}${Math.round(safeAmount).toLocaleString()}`;
  }
}

/**
 * Calculates high-level financial summary across planned allocations and actual expense ledger.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  allocations: BudgetCategoryAllocation[] = [],
  expenses: ExpenseItem[] = []
): BudgetSummary {
  const safeTotalBudget = Math.max(0, Number.isFinite(totalBudget) ? totalBudget : 0);

  // Use minor units for sum accuracy
  const plannedCents = allocations.reduce((sum, a) => sum + toCents(a.allocatedAmount), 0);
  const estimatedCents = expenses.reduce((sum, e) => sum + toCents(e.estimatedCost), 0);
  const actualCents = expenses.reduce((sum, e) => sum + toCents(e.actualCost), 0);

  const totalPlannedAllocations = fromCents(plannedCents);
  const totalEstimatedExpenses = fromCents(estimatedCents);
  const totalActualExpenses = fromCents(actualCents);

  // If actual spend recorded, use actual; otherwise evaluate against estimated
  const activeSpend = totalActualExpenses > 0 ? totalActualExpenses : totalEstimatedExpenses;
  const remainingBudget = fromCents(toCents(safeTotalBudget) - toCents(activeSpend));
  const unallocatedFunds = fromCents(toCents(safeTotalBudget) - plannedCents);

  const isOverBudget = activeSpend > safeTotalBudget;
  const isAllocationsOverBudget = totalPlannedAllocations > safeTotalBudget;

  const actualUtilizationPercentage =
    safeTotalBudget > 0 ? Math.min(999, Math.round((totalActualExpenses / safeTotalBudget) * 100)) : 0;

  const plannedUtilizationPercentage =
    safeTotalBudget > 0 ? Math.min(999, Math.round((totalPlannedAllocations / safeTotalBudget) * 100)) : 0;

  return {
    totalBudget: safeTotalBudget,
    totalPlannedAllocations,
    totalEstimatedExpenses,
    totalActualExpenses,
    remainingBudget,
    unallocatedFunds,
    isOverBudget,
    isAllocationsOverBudget,
    actualUtilizationPercentage,
    plannedUtilizationPercentage,
  };
}

/**
 * Calculates per-category breakdown and spend tracking.
 */
export function calculateCategorySummaries(
  allocations: BudgetCategoryAllocation[] = [],
  expenses: ExpenseItem[] = []
): CategorySummary[] {
  return allocations.map((alloc) => {
    const categoryExpenses = expenses.filter((e) => e.categoryKey === alloc.categoryKey);
    const estCents = categoryExpenses.reduce((sum, e) => sum + toCents(e.estimatedCost), 0);
    const actCents = categoryExpenses.reduce((sum, e) => sum + toCents(e.actualCost), 0);
    const estimatedCost = fromCents(estCents);
    const actualCost = fromCents(actCents);
    const compareCost = actualCost > 0 ? actualCost : estimatedCost;
    const isOverAllocated = compareCost > alloc.allocatedAmount;
    const remainingInCategory = fromCents(toCents(alloc.allocatedAmount) - toCents(compareCost));

    return {
      categoryKey: alloc.categoryKey,
      name: alloc.name,
      allocatedAmount: alloc.allocatedAmount,
      allocatedPercentage: alloc.percentage,
      estimatedCost,
      actualCost,
      itemCount: categoryExpenses.length,
      isOverAllocated,
      remainingInCategory,
    };
  });
}

/**
 * Normalizes percentage allocations so they cleanly add up to 100% and amounts match totalBudget exactly.
 */
export function normalizeAllocations(
  totalBudget: number,
  categories: { key: string; name: string; percent: number }[]
): BudgetCategoryAllocation[] {
  if (totalBudget <= 0 || categories.length === 0) return [];

  const totalPercent = categories.reduce((sum, c) => sum + c.percent, 0);
  let accumulatedCents = 0;
  const totalCents = toCents(totalBudget);

  const result: BudgetCategoryAllocation[] = categories.map((cat, index) => {
    const normalizedPercent = totalPercent > 0 ? (cat.percent / totalPercent) * 100 : 0;
    // Calculate cent share
    let centShare = Math.floor((totalCents * normalizedPercent) / 100);

    // If it's the last item, allocate remaining cents to ensure total matches exactly
    if (index === categories.length - 1) {
      centShare = totalCents - accumulatedCents;
    } else {
      accumulatedCents += centShare;
    }

    return {
      id: `alloc-${cat.key}-${index}`,
      categoryKey: cat.key,
      name: cat.name,
      percentage: Math.round(normalizedPercent * 10) / 10,
      allocatedAmount: Math.max(0, fromCents(centShare)),
    };
  });

  return result;
}

/**
 * Deterministic rules to suggest savings opportunities.
 */
export function generateSavingsSuggestions(
  allocations: BudgetCategoryAllocation[],
  expenses: ExpenseItem[],
  totalBudget: number,
  priorities?: string
): string[] {
  const suggestions: string[] = [];
  const summary = calculateBudgetSummary(totalBudget, allocations, expenses);
  const categorySummaries = calculateCategorySummaries(allocations, expenses);

  if (summary.isOverBudget) {
    const overage = Math.abs(summary.remainingBudget);
    suggestions.push(
      `Budget Alert: Projected spending exceeds total budget by ${formatCurrency(overage)}. Prioritize reviewing non-essential categories.`
    );
  }

  // Look for categories that exceeded allocation
  const overAllocated = categorySummaries.filter((c) => c.isOverAllocated);
  overAllocated.forEach((c) => {
    suggestions.push(
      `Category '${c.name}' is over allocated by ${formatCurrency(Math.abs(c.remainingInCategory))}. Consider negotiating package bundles or trimming optional items.`
    );
  });

  // Check venue & catering share (often 50-60% of budget)
  const venueCat = categorySummaries.find((c) => c.categoryKey === 'venue');
  if (venueCat && venueCat.allocatedPercentage > 35) {
    suggestions.push(
      `Venue allocation is high (${venueCat.allocatedPercentage}%). Inquiring about weekday rates or all-inclusive packages can often yield 10-20% in savings.`
    );
  }

  const decorCat = categorySummaries.find((c) => c.categoryKey === 'decor');
  if (decorCat && decorCat.allocatedPercentage > 15) {
    suggestions.push(
      `Decor represents ${decorCat.allocatedPercentage}% of budget. Consider repurposing ceremony floral arrangements at reception tables and utilizing ambient LED lighting.`
    );
  }

  // If user mentioned priorities in notes
  if (priorities && /food|catering/i.test(priorities)) {
    suggestions.push(
      `Food is marked as a priority: Maintain your catering standards while optimizing stationery, digital invites, and favor gifts.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      `Healthy Budget: Allocations are well-balanced within your overall budget limit of ${formatCurrency(totalBudget)}.`
    );
  }

  return suggestions;
}
