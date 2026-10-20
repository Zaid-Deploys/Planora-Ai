import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
  normalizeAllocations,
  formatCurrency,
  generateSavingsSuggestions,
  toCents,
  fromCents,
} from '../src/lib/budget/calculations';
import { BudgetCategoryAllocation, ExpenseItem } from '../src/types/event';

describe('Budget Calculations Engine', () => {
  it('correctly converts between units and cents without floating point errors', () => {
    expect(toCents(100.55)).toBe(10055);
    expect(fromCents(10055)).toBe(100.55);
    expect(toCents(0.1 + 0.2)).toBe(30); // Classic JS 0.30000000000000004 avoided
  });

  it('calculates totals, actuals, and remaining budget accurately', () => {
    const allocations: BudgetCategoryAllocation[] = [
      { id: '1', categoryKey: 'venue', name: 'Venue', percentage: 50, allocatedAmount: 50000 },
      { id: '2', categoryKey: 'catering', name: 'Catering', percentage: 50, allocatedAmount: 50000 },
    ];

    const expenses: ExpenseItem[] = [
      { id: 'e1', categoryKey: 'venue', title: 'Hall Booking', estimatedCost: 45000, actualCost: 48000, paid: true },
      { id: 'e2', categoryKey: 'catering', title: 'Buffet Advance', estimatedCost: 30000, actualCost: 25000, paid: false },
    ];

    const summary = calculateBudgetSummary(100000, allocations, expenses);

    expect(summary.totalBudget).toBe(100000);
    expect(summary.totalPlannedAllocations).toBe(100000);
    expect(summary.totalEstimatedExpenses).toBe(75000);
    expect(summary.totalActualExpenses).toBe(73000);
    expect(summary.remainingBudget).toBe(27000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.actualUtilizationPercentage).toBe(73);
  });

  it('correctly flags overspending when expenditure exceeds total budget', () => {
    const allocations: BudgetCategoryAllocation[] = [
      { id: '1', categoryKey: 'venue', name: 'Venue', percentage: 100, allocatedAmount: 50000 },
    ];

    const expenses: ExpenseItem[] = [
      { id: 'e1', categoryKey: 'venue', title: 'Venue', estimatedCost: 65000, actualCost: 65000, paid: true },
    ];

    const summary = calculateBudgetSummary(50000, allocations, expenses);

    expect(summary.isOverBudget).toBe(true);
    expect(summary.remainingBudget).toBe(-15000);
  });

  it('handles empty budgets, zero amounts, and undefined inputs defensively', () => {
    const summary = calculateBudgetSummary(0, [], []);

    expect(summary.totalBudget).toBe(0);
    expect(summary.remainingBudget).toBe(0);
    expect(summary.totalActualExpenses).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it('normalizes percentage allocations to sum to exactly 100% and amounts to total budget', () => {
    const categories = [
      { key: 'venue', name: 'Venue', percent: 33 },
      { key: 'catering', name: 'Catering', percent: 33 },
      { key: 'decor', name: 'Decor', percent: 34 },
    ];

    const total = 100000;
    const allocations = normalizeAllocations(total, categories);

    const sumAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    expect(sumAllocated).toBe(total);
  });

  it('formats currency according to INR locale standards and fallbacks', () => {
    const formattedInr = formatCurrency(125000, 'INR');
    expect(formattedInr).toContain('1,25,000');

    const formattedUsd = formatCurrency(5000, 'USD');
    expect(formattedUsd).toContain('5,000');
  });

  it('generates contextual savings suggestions for high category spend', () => {
    const allocations: BudgetCategoryAllocation[] = [
      { id: '1', categoryKey: 'venue', name: 'Venue & Facilities', percentage: 45, allocatedAmount: 45000 },
      { id: '2', categoryKey: 'decor', name: 'Decorations & Flowers', percentage: 25, allocatedAmount: 25000 },
    ];

    const suggestions = generateSavingsSuggestions(allocations, [], 100000, 'Quality Catering');
    expect(suggestions.some((s) => s.includes('Venue allocation is high'))).toBe(true);
    expect(suggestions.some((s) => s.includes('Decor represents'))).toBe(true);
  });
});
