import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAppState,
  saveAppState,
  clearAppState,
  STORAGE_KEY,
  isValidEventPlan,
} from '../src/lib/storage/localStorage';
import { EventPlan, StoredAppState } from '../src/types/event';

describe('LocalStorage Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleEvent: EventPlan = {
    id: 'test-event-1',
    name: 'Diwali Gala Dinner',
    type: 'community',
    date: '2026-11-01',
    location: 'Community Hall, New Delhi',
    guestCount: 200,
    totalBudget: 400000,
    currency: 'INR',
    categoryAllocations: [
      { id: '1', categoryKey: 'catering', name: 'Catering', percentage: 50, allocatedAmount: 200000 },
    ],
    expenses: [
      { id: 'e1', categoryKey: 'catering', title: 'Advance', estimatedCost: 100000, actualCost: 100000, paid: true },
    ],
    tasks: [
      { id: 't1', title: 'Lighting Setup', category: 'Decor', dueDate: '2026-10-31', priority: 'high', status: 'not_started' },
    ],
    vendors: [
      { id: 'v1', name: 'Delhi Lights Co', category: 'Decor', status: 'booked' },
    ],
    ideas: [
      { id: 'i1', category: 'theme', title: 'Diyas Display', description: 'Clay lamps along entry pathway', saved: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('initializes with empty state when localStorage is clean', () => {
    const state = loadAppState();
    expect(state.events).toEqual([]);
    expect(state.activeEventId).toBeNull();
    expect(state.version).toBe(1);
  });

  it('persists and retrieves multiple independent events without corruption', () => {
    const secondEvent: EventPlan = {
      ...sampleEvent,
      id: 'test-event-2',
      name: 'Priya 25th Birthday',
      type: 'birthday',
      totalBudget: 50000,
    };

    const stateToSave: StoredAppState = {
      version: 1,
      events: [sampleEvent, secondEvent],
      activeEventId: 'test-event-1',
      lastUpdated: new Date().toISOString(),
    };

    const saved = saveAppState(stateToSave);
    expect(saved).toBe(true);

    const loaded = loadAppState();
    expect(loaded.events.length).toBe(2);
    expect(loaded.events[0]?.name).toBe('Diwali Gala Dinner');
    expect(loaded.events[1]?.name).toBe('Priya 25th Birthday');
    expect(loaded.activeEventId).toBe('test-event-1');
  });

  it('safely recovers when localStorage contains corrupted or malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json-string}');

    const state = loadAppState();
    expect(state.events).toEqual([]);
    expect(state.version).toBe(1);
  });

  it('filters out corrupted event items that violate EventPlan schema', () => {
    const corruptedState = {
      version: 1,
      events: [
        sampleEvent,
        { id: 'corrupt', invalidField: true }, // Invalid object
        null,
      ],
      activeEventId: 'test-event-1',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(corruptedState));

    const loaded = loadAppState();
    expect(loaded.events.length).toBe(1);
    expect(loaded.events[0]?.id).toBe('test-event-1');
  });

  it('validates event plans with isValidEventPlan', () => {
    expect(isValidEventPlan(sampleEvent)).toBe(true);
    expect(isValidEventPlan(null)).toBe(false);
    expect(isValidEventPlan({ name: 'Incomplete' })).toBe(false);
  });

  it('clears all application data on factory reset', () => {
    saveAppState({
      version: 1,
      events: [sampleEvent],
      activeEventId: 'test-event-1',
      lastUpdated: new Date().toISOString(),
    });

    expect(loadAppState().events.length).toBe(1);

    clearAppState();
    expect(loadAppState().events.length).toBe(0);
  });
});
