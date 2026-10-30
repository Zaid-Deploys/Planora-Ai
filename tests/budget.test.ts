import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
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

  describe('Financial Precision & Largest Remainder Method', () => {
    it('guarantees equal 1/3 splits reconcile to exactly 100.0% and exact budget in cents', () => {
      const categories = [
        { key: 'c1', name: 'Category 1', percent: 1 },
        { key: 'c2', name: 'Category 2', percent: 1 },
        { key: 'c3', name: 'Category 3', percent: 1 },
      ];

      const totalBudget = 100; // $100.00
      const reconciled = normalizeAllocations(totalBudget, categories);

      // Verify exact percentage sum to 100.0%
      const totalPercentage = reconciled.reduce((sum, a) => sum + a.percentage, 0);
      expect(Math.round(totalPercentage * 10) / 10).toBe(100.0);

      // Verify exact penny sum to $100.00
      const totalAllocated = reconciled.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(Math.round(totalAllocated * 100) / 100).toBe(100.0);

      // Largest remainder assigns the extra tenth and extra cent deterministically to the first item
      expect(reconciled[0]?.percentage).toBe(33.4);
      expect(reconciled[0]?.allocatedAmount).toBe(33.34);
      expect(reconciled[1]?.percentage).toBe(33.3);
      expect(reconciled[1]?.allocatedAmount).toBe(33.33);
      expect(reconciled[2]?.percentage).toBe(33.3);
      expect(reconciled[2]?.allocatedAmount).toBe(33.33);
    });

    it('handles awkward 7-way split on an odd budget (₹5,001) with zero drift', () => {
      const categories = [
        { key: 'venue', name: 'Venue', percent: 17 },
        { key: 'food', name: 'Food', percent: 23 },
        { key: 'decor', name: 'Decor', percent: 13 },
        { key: 'photo', name: 'Photo', percent: 11 },
        { key: 'music', name: 'Music', percent: 9 },
        { key: 'attire', name: 'Attire', percent: 7 },
        { key: 'contingency', name: 'Contingency', percent: 5 },
      ];

      const totalBudget = 5001;
      const reconciled = normalizeAllocations(totalBudget, categories);

      const totalPct = reconciled.reduce((sum, a) => sum + a.percentage, 0);
      expect(Math.round(totalPct * 10) / 10).toBe(100.0);

      const totalAmt = reconciled.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(Math.round(totalAmt * 100) / 100).toBe(5001.0);
    });

    it('handles extreme small budgets like $0.05 and $1.00 correctly', () => {
      const categories = [
        { key: 'a', name: 'A', percent: 50 },
        { key: 'b', name: 'B', percent: 50 },
      ];

      const micro = normalizeAllocations(0.05, categories);
      const microSum = micro.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(Math.round(microSum * 100) / 100).toBe(0.05);

      const singleDollar = normalizeAllocations(1.0, [
        { key: 'a', name: 'A', percent: 33 },
        { key: 'b', name: 'B', percent: 33 },
        { key: 'c', name: 'C', percent: 34 },
      ]);
      const singleDollarSum = singleDollar.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(Math.round(singleDollarSum * 100) / 100).toBe(1.0);
    });

    it('handles zero budget and empty categories safely without exceptions', () => {
      expect(normalizeAllocations(0, [{ key: 'a', name: 'A', percent: 10 }])).toHaveLength(1);
      expect(normalizeAllocations(1000, [])).toHaveLength(0);
    });
  });
});
