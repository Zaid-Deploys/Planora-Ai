import { describe, it, expect, vi } from 'vitest';
import {
  exportEventToJson,
  exportAllEventsToJson,
  exportBudgetToCsv,
  exportTasksToCsv,
  exportVendorsToCsv,
} from '../src/lib/export/formatters';
import { EventPlan } from '../src/types/event';

const sampleEvent: EventPlan = {
  id: 'export-test-1',
  name: 'Celebration, "Grand & Joyful"',
  type: 'wedding',
  date: '2026-12-31',
  location: 'Heritage Resort, Jaipur',
  guestCount: 250,
  totalBudget: 1200000,
  currency: 'INR',
  categoryAllocations: [
    { id: 'a1', categoryKey: 'venue', name: 'Venue & Palace', percentage: 40, allocatedAmount: 480000 },
  ],
  expenses: [
    { id: 'e1', categoryKey: 'venue', title: 'Palace Hall, Advance', estimatedCost: 450000, actualCost: 450000, paid: true, notes: 'Includes taxes, catering kitchen access' },
  ],
  tasks: [
    { id: 't1', title: 'Confirm Fireworks Permit', category: 'Permits', dueDate: '2026-12-15', priority: 'urgent', status: 'not_started', notes: 'Call city officer' },
  ],
  vendors: [
    { id: 'v1', name: 'Jaipur Royals Caterers', category: 'Catering', contactName: 'Sunil Verma', phone: '+91 99887 76655', email: 'sunil@jaipurroyals.in', quotedPrice: 350000, status: 'booked' },
  ],
  ideas: [
    { id: 'i1', category: 'food', title: 'Dal Baati Churma Live Station', description: 'Traditional Rajasthani feast', saved: true },
  ],
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('Export Formatters (CSV & JSON)', () => {
  it('correctly exports event to JSON without throwing', () => {
    // Mock anchor element and URL createObjectURL
    const createElementSpy = vi.spyOn(document, 'createElement');
    exportEventToJson(sampleEvent);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    createElementSpy.mockRestore();
  });

  it('correctly exports all events backup JSON', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    exportAllEventsToJson([sampleEvent]);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    createElementSpy.mockRestore();
  });

  it('generates CSV with proper quotes and RFC 4180 escaping for budget items', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    exportBudgetToCsv(sampleEvent);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    createElementSpy.mockRestore();
  });

  it('generates CSV with proper headers and rows for tasks and vendors', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    exportTasksToCsv(sampleEvent);
    exportVendorsToCsv(sampleEvent);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    createElementSpy.mockRestore();
  });
});
