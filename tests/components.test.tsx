import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanoraLogo } from '../src/components/brand/PlanoraLogo';
import { DashboardView } from '../src/features/dashboard/DashboardView';
import { BudgetView } from '../src/features/budget/BudgetView';
import { Modal } from '../src/components/common/Modal';
import { EventPlan } from '../src/types/event';

const mockEvent: EventPlan = {
  id: 'evt-test-1',
  name: 'Ananya & Rohan Reception',
  type: 'wedding',
  date: '2026-11-28',
  location: 'Taj West End, Bangalore',
  guestCount: 180,
  totalBudget: 800000,
  currency: 'INR',
  categoryAllocations: [
    { id: 'a1', categoryKey: 'venue', name: 'Venue & Facilities', percentage: 40, allocatedAmount: 320000 },
    { id: 'a2', categoryKey: 'catering', name: 'Food & Catering', percentage: 35, allocatedAmount: 280000 },
  ],
  expenses: [
    { id: 'e1', categoryKey: 'venue', title: 'Banquet Hall Deposit', estimatedCost: 300000, actualCost: 300000, paid: true },
  ],
  tasks: [
    { id: 't1', title: 'Confirm Guest Headcount', category: 'Logistics', dueDate: '2026-11-20', priority: 'high', status: 'not_started' },
    { id: 't2', title: 'Music Playlist Review', category: 'Entertainment', dueDate: '2026-11-25', priority: 'medium', status: 'completed' },
  ],
  vendors: [
    { id: 'v1', name: 'Bangalore Caterers', category: 'Catering', quotedPrice: 250000, status: 'shortlisted' },
  ],
  ideas: [
    { id: 'i1', category: 'theme', title: 'Fairylight Canopy', description: 'Illuminated lawn setup', saved: true },
  ],
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

describe('Planora AI React UI Components', () => {
  it('renders the Planora AI brand logo and wordmark', () => {
    render(<PlanoraLogo showTagline />);
    expect(screen.getByText('Planora')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Plan celebrations with clarity')).toBeInTheDocument();
  });

  it('renders DashboardView empty state when no events exist', () => {
    const handleCreate = vi.fn();
    render(
      <DashboardView
        events={[]}
        activeEvent={null}
        onSelectEvent={() => {}}
        onNavigateToTab={() => {}}
        onOpenCreateModal={handleCreate}
      />
    );

    expect(screen.getByText(/Welcome to Planora AI/i)).toBeInTheDocument();
    const createBtn = screen.getByRole('button', { name: /Create Your First Event/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('renders DashboardView with real event metrics when an event is active', () => {
    render(
      <DashboardView
        events={[mockEvent]}
        activeEvent={mockEvent}
        onSelectEvent={() => {}}
        onNavigateToTab={() => {}}
        onOpenCreateModal={() => {}}
      />
    );

    expect(screen.getByText('Ananya & Rohan Reception')).toBeInTheDocument();
    expect(screen.getByText(/Taj West End, Bangalore/i)).toBeInTheDocument();
    expect(screen.getAllByText('Confirm Guest Headcount').length).toBeGreaterThanOrEqual(1);
  });

  it('renders BudgetView with calculated allocations and expense ledger', () => {
    const handleUpdate = vi.fn();
    render(<BudgetView event={mockEvent} onUpdateEvent={handleUpdate} />);

    expect(screen.getByText('Budget Planner & Ledger')).toBeInTheDocument();
    expect(screen.getByText('Banquet Hall Deposit')).toBeInTheDocument();
    expect(screen.getByText('Venue & Facilities')).toBeInTheDocument();
  });

  it('Modal handles Escape key for accessibility', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Accessibility Test Dialog">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText('Accessibility Test Dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
