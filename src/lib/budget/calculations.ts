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
 * Reconciles budget allocations so that:
 * 1. Percentages sum to EXACTLY 100.0% using the Largest Remainder Method (Hare-Niemeyer).
 * 2. Allocated amounts in minor currency units (cents/paise) sum to EXACTLY totalBudget.
 * 3. Rounding is deterministic and free of floating-point drift.
 */
export function reconcileBudgetAllocations(
  totalBudget: number,
  allocations: Array<{
    id?: string;
    categoryKey: string;
    name: string;
    percentage: number;
    allocatedAmount?: number;
  }>
): BudgetCategoryAllocation[] {
  if (allocations.length === 0) return [];

  const safeBudget = Math.max(0, Number.isFinite(totalBudget) ? totalBudget : 0);
  const totalCents = toCents(safeBudget);

  // 1. Calculate raw total percentages (defensively non-negative)
  const rawPercentages = allocations.map((a) => Math.max(0, Number.isFinite(a.percentage) ? a.percentage : 0));
  const rawSum = rawPercentages.reduce((sum, p) => sum + p, 0);

  // If all percentages are 0 or empty, distribute equally
  const count = allocations.length;
  const exactPercentages = rawPercentages.map((p) => (rawSum > 0 ? (p / rawSum) * 100 : 100 / count));

  // 2. Largest Remainder Method for Percentages (target: 1000 tenths = 100.0%)
  const TARGET_TENTHS = 1000;
  const scaledTenths = exactPercentages.map((p) => p * 10);
  const floorTenths = scaledTenths.map((s) => Math.floor(s));
  const tenthsRemainders = scaledTenths.map((s, idx) => ({
    idx,
    rem: s - (floorTenths[idx] ?? 0),
  }));

  const tenthsSum = floorTenths.reduce((sum, t) => sum + t, 0);
  const neededTenths = Math.max(0, Math.min(count, TARGET_TENTHS - tenthsSum));

  // Stable sort by remainder descending
  tenthsRemainders.sort((a, b) => b.rem - a.rem || a.idx - b.idx);
  const tenthsBonusIndices = new Set(tenthsRemainders.slice(0, neededTenths).map((r) => r.idx));

  const reconciledPercentages = floorTenths.map((t, idx) => {
    const finalTenths = t + (tenthsBonusIndices.has(idx) ? 1 : 0);
    return Math.round(finalTenths) / 10;
  });

  // 3. Largest Remainder Method for Minor Currency Units (cents)
  let reconciledAmounts: number[];
  if (totalCents === 0) {
    reconciledAmounts = allocations.map(() => 0);
  } else {
    const idealCents = exactPercentages.map((p) => (totalCents * p) / 100);
    const floorCents = idealCents.map((c) => Math.floor(c));
    const centRemainders = idealCents.map((c, idx) => ({
      idx,
      rem: c - (floorCents[idx] ?? 0),
    }));

    const centsSum = floorCents.reduce((sum, c) => sum + c, 0);
    const neededCents = Math.max(0, Math.min(count, totalCents - centsSum));

    centRemainders.sort((a, b) => b.rem - a.rem || a.idx - b.idx);
    const centBonusIndices = new Set(centRemainders.slice(0, neededCents).map((r) => r.idx));

    reconciledAmounts = floorCents.map((c, idx) => {
      const finalCents = c + (centBonusIndices.has(idx) ? 1 : 0);
      return fromCents(finalCents);
    });
  }

  // 4. Construct reconciled allocation items
  return allocations.map((alloc, idx) => ({
    id: alloc.id || `alloc-${alloc.categoryKey}-${idx}`,
    categoryKey: alloc.categoryKey,
    name: alloc.name,
    percentage: reconciledPercentages[idx] ?? 0,
    allocatedAmount: reconciledAmounts[idx] ?? 0,
  }));
}

/**
 * Normalizes percentage allocations so they cleanly add up to 100% and amounts match totalBudget exactly.
 */
export function normalizeAllocations(
  totalBudget: number,
  categories: { key: string; name: string; percent: number }[]
): BudgetCategoryAllocation[] {
  if (categories.length === 0) return [];
  const items = categories.map((cat, index) => ({
    id: `alloc-${cat.key}-${index}`,
    categoryKey: cat.key,
    name: cat.name,
    percentage: cat.percent,
  }));
  return reconcileBudgetAllocations(totalBudget, items);
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
