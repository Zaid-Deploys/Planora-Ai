import React, { useState } from 'react';
import {
  CheckCircle2,
  Coins,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Edit3,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { EventPlan } from '../../types/event';
import { formatCurrency } from '../../lib/budget/calculations';

interface EventReviewModalProps {
  plan: EventPlan | null;
  isOpen: boolean;
  onSave: (finalPlan: EventPlan) => void;
  onClose: () => void;
}

export const EventReviewModal: React.FC<EventReviewModalProps> = ({
  plan,
  isOpen,
  onSave,
  onClose,
}) => {
  if (!plan) return null;

  const [editedOverview, setEditedOverview] = useState(plan.overview || '');
  const [editedThemeDirection, setEditedThemeDirection] = useState(plan.themeDirection || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'contingencies'>('overview');

  const handleConfirmSave = () => {
    const updatedPlan: EventPlan = {
      ...plan,
      overview: editedOverview,
      themeDirection: editedThemeDirection,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedPlan);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Customize Plan"
      description={`Review the generated plan for ${plan.name} before saving to your workspace.`}
      maxWidth="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {plan.isAiGenerated ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-600)' }} />
                Generated with {plan.aiModel || 'Gemini AI'}
              </span>
            ) : (
              <span>Deterministic Starter Plan</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Discard
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmSave}
              id="save-reviewed-plan-btn"
            >
              <CheckCircle2 size={16} />
              <span>Save & Activate Plan</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          <Sparkles size={14} />
          <span>Overview & Atmosphere</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('budget')}
        >
          <Coins size={14} />
          <span>Budget Allocations ({plan.categoryAllocations.length})</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('timeline')}
        >
          <CheckSquare size={14} />
          <span>Checklist Tasks ({plan.tasks.length})</span>
        </button>
        {((plan.risksAndContingencies && plan.risksAndContingencies.length > 0) ||
          (plan.assumptionsAndQuestions && plan.assumptionsAndQuestions.length > 0)) && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'contingencies' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('contingencies')}
          >
            <ShieldAlert size={14} />
            <span>Risks & Questions</span>
          </button>
        )}
      </div>

      {/* Tab 1: Overview & Atmosphere */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <label htmlFor="review-overview" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Edit3 size={14} />
              <span>Event Overview Narrative (Editable)</span>
            </label>
            <textarea
              id="review-overview"
              className="textarea"
              value={editedOverview}
              onChange={(e) => setEditedOverview(e.target.value)}
              rows={3}
            />
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <label htmlFor="review-theme" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Edit3 size={14} />
              <span>Theme & Aesthetic Direction (Editable)</span>
            </label>
            <textarea
              id="review-theme"
              className="textarea"
              value={editedThemeDirection}
              onChange={(e) => setEditedThemeDirection(e.target.value)}
              rows={2}
            />
          </div>

          {plan.suggestedActivities && plan.suggestedActivities.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Suggested Activities & Highlights</h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                {plan.suggestedActivities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Budget Breakdown */}
      {activeTab === 'budget' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>Total Budget: {formatCurrency(plan.totalBudget, plan.currency)}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {plan.categoryAllocations.length} Categories Allocated
            </span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share (%)</th>
                  <th>Allocated Amount</th>
                </tr>
              </thead>
              <tbody>
                {plan.categoryAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td style={{ fontWeight: 600 }}>{alloc.name}</td>
                    <td>{alloc.percentage}%</td>
                    <td>{formatCurrency(alloc.allocatedAmount, plan.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Timeline & Tasks */}
      {activeTab === 'timeline' && (
        <div>
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {plan.tasks.length} actionable planning items tailored for your {plan.type} on {plan.date}:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
            {plan.tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{task.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {task.category} • Due: {task.dueDate}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {task.description}
                    </div>
                  )}
                </div>
                <span
                  className={`badge ${
                    task.priority === 'urgent'
                      ? 'badge-danger'
                      : task.priority === 'high'
                      ? 'badge-warning'
                      : 'badge-primary'
                  }`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Contingencies & Clarifying Questions */}
      {activeTab === 'contingencies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {plan.risksAndContingencies && plan.risksAndContingencies.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--warning-600)', fontWeight: 600 }}>
                <ShieldAlert size={18} />
                <span>Identified Risks & Contingency Recommendations</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                {plan.risksAndContingencies.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.assumptionsAndQuestions && plan.assumptionsAndQuestions.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                <HelpCircle size={18} />
                <span>Assumptions & Clarifying Questions</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                {plan.assumptionsAndQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
