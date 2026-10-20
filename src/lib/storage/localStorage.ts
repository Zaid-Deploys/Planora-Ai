import { EventPlan, StoredAppState } from '../../types/event';

export const STORAGE_KEY = 'planora_ai_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Creates an empty state structure.
 */
export function createInitialAppState(): StoredAppState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    events: [],
    activeEventId: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Validates that an object conforms to EventPlan minimally to prevent runtime crashes
 * from corrupted localStorage items.
 */
export function isValidEventPlan(obj: unknown): obj is EventPlan {
  if (!obj || typeof obj !== 'object') return false;
  const cand = obj as Partial<EventPlan>;
  return (
    typeof cand.id === 'string' &&
    typeof cand.name === 'string' &&
    typeof cand.date === 'string' &&
    typeof cand.totalBudget === 'number' &&
    Array.isArray(cand.categoryAllocations) &&
    Array.isArray(cand.expenses) &&
    Array.isArray(cand.tasks) &&
    Array.isArray(cand.vendors) &&
    Array.isArray(cand.ideas)
  );
}

/**
 * Safely loads application state from browser localStorage.
 * Defensive against missing, malformed, or outdated schemas.
 */
export function loadAppState(): StoredAppState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialAppState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialAppState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[Planora Storage] Stored state was not an object. Resetting to initial state.');
      return createInitialAppState();
    }

    // Version migration check
    const rawEvents = Array.isArray(parsed.events) ? parsed.events : [];
    const validEvents: EventPlan[] = rawEvents.filter(isValidEventPlan);

    let activeEventId = typeof parsed.activeEventId === 'string' ? parsed.activeEventId : null;
    if (activeEventId && !validEvents.some((e) => e.id === activeEventId)) {
      activeEventId = validEvents[0]?.id || null;
    }

    return {
      version: CURRENT_SCHEMA_VERSION,
      events: validEvents,
      activeEventId: activeEventId || validEvents[0]?.id || null,
      lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString(),
    };
  } catch (err) {
    console.error('[Planora Storage] Failed to parse localStorage state:', err);
    return createInitialAppState();
  }
}

/**
 * Persists application state to browser localStorage.
 * Never stores API keys, tokens, or credentials.
 */
export function saveAppState(state: StoredAppState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload: StoredAppState = {
      version: CURRENT_SCHEMA_VERSION,
      events: state.events,
      activeEventId: state.activeEventId,
      lastUpdated: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('[Planora Storage] Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Clears all Planora application data from localStorage.
 */
export function clearAppState(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('[Planora Storage] Failed to clear localStorage:', err);
    return false;
  }
}
