import React, { useState } from 'react';
import {
  Coins,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Lightbulb,
} from 'lucide-react';
import { EventPlan, ExpenseItem, BudgetCategoryAllocation } from '../../types/event';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
  formatCurrency,
  generateSavingsSuggestions,
} from '../../lib/budget/calculations';
import { exportBudgetToCsv } from '../../lib/export/formatters';
import { Modal } from '../../components/common/Modal';

interface BudgetViewProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ event, onUpdateEvent }) => {
  // Modal states for adding/editing expense item
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(event.categoryAllocations[0]?.categoryKey || 'venue');
  const [expenseEstimated, setExpenseEstimated] = useState<number | ''>('');
  const [expenseActual, setExpenseActual] = useState<number | ''>('');
  const [expensePaid, setExpensePaid] = useState(false);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Editing category allocation inline
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [editAllocAmount, setEditAllocAmount] = useState<number | ''>('');

  const summary = calculateBudgetSummary(event.totalBudget, event.categoryAllocations, event.expenses);
  const categorySummaries = calculateCategorySummaries(event.categoryAllocations, event.expenses);
  const savingsSuggestions = generateSavingsSuggestions(
    event.categoryAllocations,
    event.expenses,
    event.totalBudget,
    event.planningPriorities
  );

  // Open modal to add expense
  const handleOpenAddExpense = (defaultCat?: string) => {
    setEditingExpenseId(null);
    setExpenseTitle('');
    setExpenseCategory(defaultCat || event.categoryAllocations[0]?.categoryKey || 'venue');
    setExpenseEstimated('');
    setExpenseActual('');
    setExpensePaid(false);
    setExpenseNotes('');
    setIsExpenseModalOpen(true);
  };

  // Open modal to edit expense
  const handleOpenEditExpense = (item: ExpenseItem) => {
    setEditingExpenseId(item.id);
    setExpenseTitle(item.title);
    setExpenseCategory(item.categoryKey);
    setExpenseEstimated(item.estimatedCost);
    setExpenseActual(item.actualCost);
    setExpensePaid(item.paid);
    setExpenseNotes(item.notes || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) return;

    const estCost = typeof expenseEstimated === 'number' ? expenseEstimated : 0;
    const actCost = typeof expenseActual === 'number' ? expenseActual : 0;

    let updatedExpenses: ExpenseItem[];

    if (editingExpenseId) {
      updatedExpenses = event.expenses.map((item) =>
        item.id === editingExpenseId
          ? {
              ...item,
              title: expenseTitle.trim(),
              categoryKey: expenseCategory,
              estimatedCost: estCost,
              actualCost: actCost,
              paid: expensePaid,
              notes: expenseNotes.trim() || undefined,
            }
          : item
      );
    } else {
      const newItem: ExpenseItem = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: expenseTitle.trim(),
        categoryKey: expenseCategory,
        estimatedCost: estCost,
        actualCost: actCost,
        paid: expensePaid,
        notes: expenseNotes.trim() || undefined,
      };
      updatedExpenses = [...event.expenses, newItem];
    }

    onUpdateEvent({
      ...event,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });

    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = event.expenses.filter((e) => e.id !== id);
    onUpdateEvent({
      ...event,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTogglePaid = (item: ExpenseItem) => {
    const updatedExpenses = event.expenses.map((e) =>
      e.id === item.id ? { ...e, paid: !e.paid } : e
    );
    onUpdateEvent({
      ...event,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  // Start editing category allocation
  const handleStartEditAlloc = (alloc: BudgetCategoryAllocation) => {
    setEditingAllocId(alloc.id);
    setEditAllocAmount(alloc.allocatedAmount);
  };

  // Save updated category allocation amount and recompute percentage
  const handleSaveAlloc = (allocId: string) => {
    if (typeof editAllocAmount !== 'number' || editAllocAmount < 0) {
      setEditingAllocId(null);
      return;
    }

    const updatedAllocations = event.categoryAllocations.map((alloc) => {
      if (alloc.id === allocId) {
        const newPercent =
          event.totalBudget > 0
            ? Math.round((editAllocAmount / event.totalBudget) * 1000) / 10
            : 0;
        return {
          ...alloc,
          allocatedAmount: editAllocAmount,
          percentage: newPercent,
        };
      }
      return alloc;
    });

    onUpdateEvent({
      ...event,
      categoryAllocations: updatedAllocations,
      updatedAt: new Date().toISOString(),
    });

    setEditingAllocId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Budget Planner & Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deterministic financial tracking for {event.name}. Track category allocations and itemized costs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportBudgetToCsv(event)}
            title="Download budget and expenses as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAddExpense()}
            id="add-expense-item-btn"
          >
            <Plus size={15} />
            <span>Add Expense Item</span>
          </button>
        </div>
      </div>

      {/* Overspending Alert if applicable */}
      {summary.isOverBudget && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--danger-600)',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Budget Overspend Warning:</strong> Total commitments ({formatCurrency(summary.totalActualExpenses || summary.totalEstimatedExpenses, event.currency)}) exceed your set budget of {formatCurrency(event.totalBudget, event.currency)} by {formatCurrency(Math.abs(summary.remainingBudget), event.currency)}.
          </div>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Budget
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0' }}>
            {formatCurrency(event.totalBudget, event.currency)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Allocated: {summary.plannedUtilizationPercentage}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Planned Allocations
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0' }}>
            {formatCurrency(summary.totalPlannedAllocations, event.currency)}
          </div>
          <div style={{ fontSize: '0.8rem', color: summary.isAllocationsOverBudget ? 'var(--danger-600)' : 'var(--text-muted)' }}>
            {summary.isAllocationsOverBudget
              ? `Exceeds budget by ${formatCurrency(summary.totalPlannedAllocations - summary.totalBudget, event.currency)}`
              : `${formatCurrency(summary.unallocatedFunds, event.currency)} unallocated`}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Actual Spent
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0', color: 'var(--primary-700)' }}>
            {formatCurrency(summary.totalActualExpenses, event.currency)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Estimated: {formatCurrency(summary.totalEstimatedExpenses, event.currency)}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Remaining Funds
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              margin: '0.4rem 0',
              color: summary.isOverBudget ? 'var(--danger-600)' : 'var(--success-600)',
            }}
          >
            {formatCurrency(summary.remainingBudget, event.currency)}
          </div>
          <div style={{ fontSize: '0.8rem', color: summary.isOverBudget ? 'var(--danger-600)' : 'var(--text-muted)' }}>
            {summary.isOverBudget ? 'Deficit' : 'Available to spend'}
          </div>
        </div>
      </div>

      {/* Savings Opportunities & Intelligent Advisory */}
      {savingsSuggestions.length > 0 && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-default)',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-800)', fontWeight: 600 }}>
            <Lightbulb size={18} style={{ color: 'var(--accent-600)' }} />
            <span>Planora Budget Advisory & Savings Opportunities</span>
          </div>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {savingsSuggestions.map((sug, idx) => (
              <li key={idx}>{sug}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Allocation Breakdown */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Category Allocations</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Edit target amounts directly to adjust your budget distribution.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {categorySummaries.map((cat) => (
            <div
              key={cat.categoryKey}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${cat.isOverAllocated ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                backgroundColor: cat.isOverAllocated ? 'var(--danger-50)' : 'var(--bg-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.name}</div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {cat.allocatedPercentage}%
                  </span>
                </div>

                {editingAllocId === `alloc-${cat.categoryKey}` || (editingAllocId && editingAllocId.includes(cat.categoryKey)) ? (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      className="input"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      value={editAllocAmount}
                      onChange={(e) => setEditAllocAmount(e.target.value ? Number(e.target.value) : '')}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveAlloc(editingAllocId!)}
                    >
                      <Check size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const matched = event.categoryAllocations.find((a) => a.categoryKey === cat.categoryKey);
                      if (matched) handleStartEditAlloc(matched);
                    }}
                    title="Click to edit planned amount"
                  >
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {formatCurrency(cat.allocatedAmount, event.currency)}
                    </div>
                    <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span>Actual Spent:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrency(cat.actualCost, event.currency)} ({cat.itemCount} items)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Category Balance:</span>
                  <span style={{ fontWeight: 600, color: cat.isOverAllocated ? 'var(--danger-600)' : 'var(--success-600)' }}>
                    {cat.isOverAllocated
                      ? `Over by ${formatCurrency(Math.abs(cat.remainingInCategory), event.currency)}`
                      : `${formatCurrency(cat.remainingInCategory, event.currency)} left`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Items Ledger */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Expense Items Ledger</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Track itemized vendor invoices, deposits, and supplies.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAddExpense()}
          >
            <Plus size={14} />
            <span>Add Item</span>
          </button>
        </div>

        {event.expenses.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Coins size={36} style={{ color: 'var(--primary-600)', marginBottom: '0.5rem' }} />
            <p>No expense items recorded yet.</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
              onClick={() => handleOpenAddExpense()}
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Item Title</th>
                  <th>Category</th>
                  <th>Estimated</th>
                  <th>Actual</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {event.expenses.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(item)}
                        className={`badge ${item.paid ? 'badge-success' : 'badge-neutral'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle paid status"
                        aria-label={`Toggle paid status for ${item.title}`}
                      >
                        {item.paid ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {item.categoryKey}
                      </span>
                    </td>
                    <td>{formatCurrency(item.estimatedCost, event.currency)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {item.actualCost > 0 ? formatCurrency(item.actualCost, event.currency) : '-'}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      {item.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditExpense(item)}
                          title="Edit expense item"
                          aria-label={`Edit ${item.title}`}
                          style={{ padding: '0.3rem 0.5rem' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger-600)', padding: '0.3rem 0.5rem' }}
                          onClick={() => handleDeleteExpense(item.id)}
                          title="Delete expense item"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Item Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpenseId ? 'Edit Expense Item' : 'Add Expense Item'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense}>
          <div className="form-group">
            <label htmlFor="exp-title" className="form-label form-label-required">
              Item Title / Vendor Description
            </label>
            <input
              id="exp-title"
              type="text"
              className="input"
              placeholder="e.g. Lawn Venue Deposit, Floral Mandap / Archway, DJ sound deposit"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="exp-category" className="form-label form-label-required">
                Category
              </label>
              <select
                id="exp-category"
                className="select"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                {event.categoryAllocations.map((alloc) => (
                  <option key={alloc.categoryKey} value={alloc.categoryKey}>
                    {alloc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exp-paid" className="form-label">
                Payment Status
              </label>
              <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '0.5rem' }}>
                <input
                  id="exp-paid"
                  type="checkbox"
                  style={{ width: '18px', height: '18px' }}
                  checked={expensePaid}
                  onChange={(e) => setExpensePaid(e.target.checked)}
                />
                <label htmlFor="exp-paid" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Mark as Paid
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="exp-estimated" className="form-label">
                Estimated Cost ({event.currency})
              </label>
              <input
                id="exp-estimated"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 50000"
                value={expenseEstimated}
                onChange={(e) => setExpenseEstimated(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exp-actual" className="form-label">
                Actual Cost ({event.currency})
              </label>
              <input
                id="exp-actual"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 48000"
                value={expenseActual}
                onChange={(e) => setExpenseActual(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exp-notes" className="form-label">
              Notes & Payment Terms
            </label>
            <input
              id="exp-notes"
              type="text"
              className="input"
              placeholder="e.g. 50% due at signing, 50% due on event morning"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsExpenseModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="save-expense-btn">
              {editingExpenseId ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
