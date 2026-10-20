import React from 'react';
import { Sparkles, Calendar, PlusCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { EventPlan } from '../../types/event';

interface PlannerViewProps {
  activeEvent: EventPlan | null;
  onOpenCreateModal: () => void;
  onNavigateToTab: (tab: 'budget' | 'timeline' | 'vendors' | 'ideas') => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  activeEvent,
  onOpenCreateModal,
  onNavigateToTab,
}) => {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Card */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="badge"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: 'none' }}
          >
            PromptWars Challenge 5
          </span>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Celebration & Event Planner</span>
        </div>

        <h1 style={{ color: '#ffffff', fontSize: '2.2rem', fontWeight: 800 }}>
          Planora AI Intelligent Planner
        </h1>

        <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.05rem', maxWidth: '680px' }}>
          Craft personalized celebration roadmaps using Google Gemini. Input your vision, guest
          headcount, budget constraints, dietary needs, and accessibility requirements to produce a
          fully structured celebration dossier.
        </p>

        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-lg"
            style={{ backgroundColor: '#ffffff', color: 'var(--primary-900)' }}
            onClick={onOpenCreateModal}
          >
            <PlusCircle size={18} />
            <span>Plan a New Celebration</span>
          </button>
        </div>
      </div>

      {/* Active Event AI Dossier Review */}
      {activeEvent ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div className="card-header">
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Celebration Dossier
              </div>
              <h2 style={{ fontSize: '1.45rem', marginTop: '0.2rem' }}>{activeEvent.name}</h2>
            </div>
            <span className="badge badge-primary">{activeEvent.type}</span>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
              Curated Event Overview
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {activeEvent.overview || 'Overview narrative will appear here once planned.'}
            </p>
          </div>

          {activeEvent.themeDirection && (
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-700)', marginBottom: '0.35rem' }}>
                Theme & Aesthetic Vision
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {activeEvent.themeDirection}
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => onNavigateToTab('budget')}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
                Budget Allocation
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {activeEvent.categoryAllocations.length} categories planned
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => onNavigateToTab('timeline')}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
                Timeline & Checklist
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {activeEvent.tasks.length} tasks scheduled
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => onNavigateToTab('ideas')}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
                Personalized Ideas
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {activeEvent.ideas.length} ideas curated
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Calendar size={36} style={{ color: 'var(--primary-600)', marginBottom: '0.75rem' }} />
          <h3>No Celebration Currently Selected</h3>
          <p style={{ maxWidth: '440px', margin: '0.5rem auto 1.5rem', color: 'var(--text-muted)' }}>
            Create an event plan with Gemini AI to generate custom schedules, budgets, and checklists.
          </p>
          <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
            <PlusCircle size={16} />
            <span>Create Celebration</span>
          </button>
        </div>
      )}

      {/* Architecture & Reliability Principles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-600)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Bounded System Instructions</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Planora enforces strict prompt boundary isolation. User notes are quarantined in
            untrusted context blocks, preventing prompt injection and enforcing structured JSON output.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--success-600)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Zero Cloud Leakage</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your GEMINI_API_KEY remains strictly server-side inside Vercel Serverless Functions. Event
            data is saved exclusively in your browser localStorage without unauthorized telemetry.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={18} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Deterministic Verification</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AI creativity is paired with deterministic mathematical reconciliation. Budget
            allocations are checked down to the exact cent, ensuring percentages cleanly balance.
          </p>
        </div>
      </div>
    </div>
  );
};
