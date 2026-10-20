import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { EventPlan, EventType, EventSetting, SUPPORTED_CURRENCIES } from '../../types/event';
import { PlanGenerationRequest, PlanGenerationResponse } from '../../types/api';
import { planGenerationRequestSchema } from '../../lib/validation/schemas';
import { normalizeAllocations, DEFAULT_BUDGET_CATEGORIES } from '../../lib/budget/calculations';
import { generateDeterministicStarterTasks } from '../../lib/timeline/generator';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanReadyForReview: (plan: EventPlan) => void;
}

export const EventCreateModal: React.FC<EventCreateModalProps> = ({
  isOpen,
  onClose,
  onPlanReadyForReview,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('wedding');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<number | ''>(50);
  const [totalBudget, setTotalBudget] = useState<number | ''>(250000);
  const [currency, setCurrency] = useState('INR');

  // Optional Context State
  const [setting, setSetting] = useState<EventSetting>('indoor');
  const [theme, setTheme] = useState('');
  const [colorPreferences, setColorPreferences] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [culturalTraditions, setCulturalTraditions] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [planningPriorities, setPlanningPriorities] = useState('');
  const [notes, setNotes] = useState('');

  // UI accordion for optional fields
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  // Validation & Loading states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorCode, setApiErrorCode] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setType('wedding');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setGuestCount(50);
    setTotalBudget(250000);
    setCurrency('INR');
    setSetting('indoor');
    setTheme('');
    setColorPreferences('');
    setDietaryRequirements('');
    setCulturalTraditions('');
    setAccessibilityNeeds('');
    setPlanningPriorities('');
    setNotes('');
    setFieldErrors({});
    setApiError(null);
    setApiErrorCode(null);
    setIsGenerating(false);
  };

  const handleClose = () => {
    if (!isGenerating) {
      resetForm();
      onClose();
    }
  };

  const validateForm = (): PlanGenerationRequest | null => {
    const payload = {
      name,
      type,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location,
      guestCount: Number(guestCount),
      totalBudget: Number(totalBudget),
      currency,
      setting,
      theme: theme || undefined,
      colorPreferences: colorPreferences || undefined,
      dietaryRequirements: dietaryRequirements || undefined,
      culturalTraditions: culturalTraditions || undefined,
      accessibilityNeeds: accessibilityNeeds || undefined,
      planningPriorities: planningPriorities || undefined,
      notes: notes || undefined,
    };

    const result = planGenerationRequestSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0];
        if (field && typeof field === 'string' && !errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return null;
    }

    setFieldErrors({});
    return result.data;
  };

  // 1. Deterministic Starter Plan (Offline / Fallback)
  const handleCreateStarterPlan = () => {
    const validData = validateForm();
    if (!validData) return;

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Deterministic allocations
    const categoryShares = DEFAULT_BUDGET_CATEGORIES.map((c) => ({
      key: c.key,
      name: c.name,
      percent: c.defaultPercent,
    }));
    const categoryAllocations = normalizeAllocations(validData.totalBudget, categoryShares);

    // Deterministic tasks
    const tasks = generateDeterministicStarterTasks({
      type: validData.type,
      date: validData.date,
      setting: validData.setting,
      guestCount: validData.guestCount,
      accessibilityNeeds: validData.accessibilityNeeds,
    });

    const starterPlan: EventPlan = {
      id: eventId,
      name: validData.name,
      type: validData.type,
      date: validData.date,
      startTime: validData.startTime,
      endTime: validData.endTime,
      location: validData.location,
      guestCount: validData.guestCount,
      totalBudget: validData.totalBudget,
      currency: validData.currency,
      setting: validData.setting,
      theme: validData.theme,
      colorPreferences: validData.colorPreferences,
      dietaryRequirements: validData.dietaryRequirements,
      culturalTraditions: validData.culturalTraditions,
      accessibilityNeeds: validData.accessibilityNeeds,
      planningPriorities: validData.planningPriorities,
      notes: validData.notes,
      overview: `A structured ${validData.type} celebration planned in ${validData.location} for ${validData.guestCount} guests.`,
      themeDirection: validData.theme || 'Cohesive and welcoming celebration.',
      isAiGenerated: false,
      categoryAllocations,
      expenses: [],
      tasks,
      vendors: [],
      ideas: [
        {
          id: `idea-starter-1`,
          category: 'theme',
          title: 'Signature Celebration Palette',
          description: validData.colorPreferences ? `Incorporate your preferred colors: ${validData.colorPreferences}` : 'Use 2 primary warm tones with metallic accents.',
          saved: false,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    onPlanReadyForReview(starterPlan);
    handleClose();
  };

  // 2. Gemini AI Plan Generation via /api/plan
  const handleGenerateAiPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const validData = validateForm();
    if (!validData) return;

    setIsGenerating(true);
    setApiError(null);
    setApiErrorCode(null);
    setGenerationStep('Connecting to Planora AI Planning Engine...');

    try {
      setGenerationStep('Analyzing celebration context and guest requirements...');

      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setApiError(data.error || 'Plan generation failed. Please try again.');
        setApiErrorCode(data.code || 'API_ERROR');
        setIsGenerating(false);
        return;
      }

      const planData = data as PlanGenerationResponse;
      setGenerationStep('Constructing personalized budget allocations and timeline...');

      const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      // Convert generated budget allocations into app model
      const categoryAllocations = planData.budgetAllocations.map((alloc, idx) => ({
        id: `alloc-${alloc.categoryKey}-${idx}`,
        categoryKey: alloc.categoryKey,
        name: alloc.name,
        percentage: alloc.percentage,
        allocatedAmount: alloc.allocatedAmount,
      }));

      // Convert generated suggested expenses
      const expenses = (planData.suggestedExpenses || []).map((exp, idx) => ({
        id: `exp-${idx}-${Date.now()}`,
        categoryKey: exp.categoryKey,
        title: exp.title,
        estimatedCost: exp.estimatedCost,
        actualCost: 0,
        paid: false,
      }));

      // Convert generated tasks to calendar dates
      const [year, month, day] = validData.date.split('-').map(Number);
      const eventTargetDate = new Date(year!, month! - 1, day!);

      const tasks = planData.tasks.map((task, idx) => {
        const dueDateObj = new Date(eventTargetDate);
        dueDateObj.setDate(dueDateObj.getDate() - task.daysBeforeEvent);
        const y = dueDateObj.getFullYear();
        const m = String(dueDateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dueDateObj.getDate()).padStart(2, '0');

        return {
          id: `task-ai-${idx}-${Date.now()}`,
          title: task.title,
          description: task.description,
          category: task.category,
          dueDate: `${y}-${m}-${d}`,
          priority: task.priority,
          status: 'not_started' as const,
          isAiGenerated: true,
        };
      });

      // Convert ideas
      const ideas = planData.ideas.map((idea, idx) => ({
        id: `idea-ai-${idx}-${Date.now()}`,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        tags: idea.tags,
        saved: false,
      }));

      const generatedPlan: EventPlan = {
        id: eventId,
        name: validData.name,
        type: validData.type,
        date: validData.date,
        startTime: validData.startTime,
        endTime: validData.endTime,
        location: validData.location,
        guestCount: validData.guestCount,
        totalBudget: validData.totalBudget,
        currency: validData.currency,
        setting: validData.setting,
        theme: validData.theme,
        colorPreferences: validData.colorPreferences,
        dietaryRequirements: validData.dietaryRequirements,
        culturalTraditions: validData.culturalTraditions,
        accessibilityNeeds: validData.accessibilityNeeds,
        planningPriorities: validData.planningPriorities,
        notes: validData.notes,
        overview: planData.overview,
        themeDirection: planData.themeDirection,
        suggestedActivities: planData.suggestedActivities,
        vendorCriteria: planData.vendorCriteria,
        risksAndContingencies: planData.risksAndContingencies,
        assumptionsAndQuestions: planData.assumptionsAndQuestions,
        isAiGenerated: true,
        aiModel: planData.model,
        categoryAllocations,
        expenses,
        tasks,
        vendors: [],
        ideas,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setIsGenerating(false);
      onPlanReadyForReview(generatedPlan);
      handleClose();
    } catch (err: unknown) {
      console.error('[EventCreateModal API Call Error]:', err);
      setApiError('Unable to reach plan generation endpoint. Please check your network or server status.');
      setApiErrorCode('NETWORK_ERROR');
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Celebration Plan"
      description="Define your celebration details to generate a comprehensive AI plan or starter checklist."
      maxWidth="lg"
    >
      {/* API Error Alert Banner with Fallback to Deterministic Starter Checklist */}
      {apiError && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-600)', fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>AI Plan Generation Unavailable</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {apiError}
          </div>

          {apiErrorCode === 'MISSING_API_KEY' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Tip: Configure <code>GEMINI_API_KEY</code> in your environment variables to enable Gemini AI planning.
            </div>
          )}

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCreateStarterPlan}
            >
              <FileText size={15} />
              <span>Continue with Deterministic Starter Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay State during Generation */}
      {isGenerating ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
          aria-live="polite"
        >
          <Loader2 size={44} className="spinning-icon" style={{ color: 'var(--primary-600)' }} />
          <h3 style={{ fontSize: '1.35rem' }}>Generating Personalized Celebration Plan...</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.9rem' }}>
            {generationStep}
          </p>
        </div>
      ) : (
        <form onSubmit={handleGenerateAiPlan}>
          {/* Section 1: Required Basics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Event Name */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="event-name" className="form-label form-label-required">
                Event Name
              </label>
              <input
                id="event-name"
                type="text"
                className={`input ${fieldErrors.name ? 'error' : ''}`}
                placeholder="e.g. Maya & Leo's Coastal Wedding, Aarav's 30th Birthday"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
            </div>

            {/* Event Type */}
            <div className="form-group">
              <label htmlFor="event-type" className="form-label form-label-required">
                Event Type
              </label>
              <select
                id="event-type"
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday Party</option>
                <option value="community">Community Gathering</option>
                <option value="anniversary">Anniversary</option>
                <option value="graduation">Graduation</option>
                <option value="other">Other Celebration</option>
              </select>
            </div>

            {/* Event Date */}
            <div className="form-group">
              <label htmlFor="event-date" className="form-label form-label-required">
                Event Date
              </label>
              <input
                id="event-date"
                type="date"
                className={`input ${fieldErrors.date ? 'error' : ''}`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              {fieldErrors.date && <div className="form-error">{fieldErrors.date}</div>}
            </div>

            {/* Location / City */}
            <div className="form-group">
              <label htmlFor="event-location" className="form-label form-label-required">
                City / Location Description
              </label>
              <input
                id="event-location"
                type="text"
                className={`input ${fieldErrors.location ? 'error' : ''}`}
                placeholder="e.g. Udaipur, Mumbai, Goa, San Francisco"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              {fieldErrors.location && <div className="form-error">{fieldErrors.location}</div>}
            </div>

            {/* Guest Count */}
            <div className="form-group">
              <label htmlFor="event-guests" className="form-label form-label-required">
                Expected Guest Count
              </label>
              <input
                id="event-guests"
                type="number"
                min="1"
                max="100000"
                className={`input ${fieldErrors.guestCount ? 'error' : ''}`}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value ? Number(e.target.value) : '')}
                required
              />
              {fieldErrors.guestCount && <div className="form-error">{fieldErrors.guestCount}</div>}
            </div>

            {/* Budget & Currency */}
            <div className="form-group">
              <label htmlFor="event-budget" className="form-label form-label-required">
                Total Budget
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  aria-label="Currency"
                  className="select"
                  style={{ width: '100px', flexShrink: 0 }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <input
                  id="event-budget"
                  type="number"
                  min="1"
                  className={`input ${fieldErrors.totalBudget ? 'error' : ''}`}
                  placeholder="e.g. 500000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>
              {fieldErrors.totalBudget && <div className="form-error">{fieldErrors.totalBudget}</div>}
            </div>

            {/* Setting (Indoor, Outdoor, Mixed) */}
            <div className="form-group">
              <label htmlFor="event-setting" className="form-label">
                Venue Setting
              </label>
              <select
                id="event-setting"
                className="select"
                value={setting}
                onChange={(e) => setSetting(e.target.value as EventSetting)}
              >
                <option value="indoor">Indoor Venue</option>
                <option value="outdoor">Outdoor (Lawn, Beach, Garden)</option>
                <option value="mixed">Mixed Indoor & Outdoor</option>
              </select>
            </div>
          </div>

          {/* Collapsible Section for Rich Context (Dietary, Accessibility, Traditions, Theme) */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-700)',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem 0',
              }}
              aria-expanded={showOptionalDetails}
            >
              {showOptionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span>
                {showOptionalDetails ? 'Hide additional context & preferences' : 'Add rich preferences (theme, dietary, accessibility, traditions)'}
              </span>
            </button>

            {showOptionalDetails && (
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="event-theme" className="form-label">Desired Theme & Vibe</label>
                    <input
                      id="event-theme"
                      type="text"
                      className="input"
                      placeholder="e.g. Royal Heritage, Minimalist Botanical, Retro Disco"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="event-colors" className="form-label">Color Palette</label>
                    <input
                      id="event-colors"
                      type="text"
                      className="input"
                      placeholder="e.g. Ivory & Sage Green, Blush Pink & Gold"
                      value={colorPreferences}
                      onChange={(e) => setColorPreferences(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="event-dietary" className="form-label">Dietary Restrictions & Preferences</label>
                    <input
                      id="event-dietary"
                      type="text"
                      className="input"
                      placeholder="e.g. Pure Vegetarian, Jain options, Gluten-free desserts, Halal"
                      value={dietaryRequirements}
                      onChange={(e) => setDietaryRequirements(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="event-accessibility" className="form-label">Accessibility Considerations</label>
                    <input
                      id="event-accessibility"
                      type="text"
                      className="input"
                      placeholder="e.g. Wheelchair ramp needed, elderly guest seating, sign language interpreter"
                      value={accessibilityNeeds}
                      onChange={(e) => setAccessibilityNeeds(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="event-traditions" className="form-label">Cultural or Religious Traditions</label>
                  <input
                    id="event-traditions"
                    type="text"
                    className="input"
                    placeholder="e.g. Sangeet & Mehndi ceremonies, Nikah, Baraat entrance, Candle lighting"
                    value={culturalTraditions}
                    onChange={(e) => setCulturalTraditions(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="event-priorities" className="form-label">Planning Priorities</label>
                  <input
                    id="event-priorities"
                    type="text"
                    className="input"
                    placeholder="e.g. Photography is highest priority, open bar, top quality DJ"
                    value={planningPriorities}
                    onChange={(e) => setPlanningPriorities(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="event-notes" className="form-label">Special Notes & Constraints</label>
                  <textarea
                    id="event-notes"
                    className="textarea"
                    placeholder="Any specific requests, family considerations, or special surprises..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCreateStarterPlan}
              title="Create an event with deterministic starter checklist without calling Gemini"
            >
              <FileText size={16} />
              <span>Use Starter Plan (Offline)</span>
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                id="generate-ai-plan-submit-btn"
              >
                <Sparkles size={16} />
                <span>Generate Plan with Gemini</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
