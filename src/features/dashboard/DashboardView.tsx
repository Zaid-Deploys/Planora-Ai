import React from 'react';
import {
  Calendar,
  Sparkles,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Building,
  CheckSquare,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { calculateBudgetSummary, formatCurrency } from '../../lib/budget/calculations';
import { calculateDaysRemaining, isTaskOverdue, isTaskUrgent } from '../../lib/timeline/generator';

interface DashboardViewProps {
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (id: string) => void;
  onNavigateToTab: (tab: 'planner' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'events') => void;
  onOpenCreateModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onNavigateToTab,
  onOpenCreateModal,
}) => {
  // Empty State: when no events exist yet
  if (events.length === 0) {
    return (
      <div style={{ maxWidth: '780px', margin: '2rem auto', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={36} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Welcome to Planora AI
            </h2>
            <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-secondary)' }}>
              Organize memorable weddings, birthdays, community gatherings, and celebrations with
              budget allocations, actionable timelines, vendor management, and personalized AI ideas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenCreateModal}
              id="dashboard-create-first-event-btn"
            >
              <PlusCircle size={18} />
              <span>Create Your First Event</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              width: '100%',
              marginTop: '2rem',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                Context-Aware AI
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Intelligent plans scaled to your guest count, setting, cultural traditions, and dietary constraints.
              </div>
            </div>

            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                Deterministic Math
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Accurate cent-level budget calculations, variance tracking, and overspending safeguards.
              </div>
            </div>

            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                Offline Fallback
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Full local functionality and structured starter checklists remain available even without an AI key.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real metrics across all saved events
  const totalSavedEvents = events.length;

  // Filter upcoming vs past events
  const upcomingEvents = events.filter((e) => calculateDaysRemaining(e.date) >= 0);

  // Focus event: activeEvent if selected, else first upcoming event
  const focusEvent = activeEvent || upcomingEvents[0] || events[0]!;

  const budgetSummary = calculateBudgetSummary(
    focusEvent.totalBudget,
    focusEvent.categoryAllocations,
    focusEvent.expenses
  );

  const completedTasksCount = focusEvent.tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = focusEvent.tasks.length;
  const overdueTasksCount = focusEvent.tasks.filter((t) => isTaskOverdue(t)).length;
  const urgentTasksCount = focusEvent.tasks.filter((t) => isTaskUrgent(t)).length;
  const taskProgressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Next critical deadline
  const incompleteTasksSorted = [...focusEvent.tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDeadlineTask = incompleteTasksSorted[0];

  const daysUntilEvent = calculateDaysRemaining(focusEvent.date);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome & Event Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {focusEvent.type}
            </span>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {daysUntilEvent > 0
                ? `${daysUntilEvent} days remaining`
                : daysUntilEvent === 0
                ? 'Happening today!'
                : `${Math.abs(daysUntilEvent)} days ago`}
            </span>
          </div>

          <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginBottom: '0.25rem' }}>
            {focusEvent.name}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
            {focusEvent.location} • {focusEvent.date} • {focusEvent.guestCount} Guests
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigateToTab('timeline')}
            style={{ backgroundColor: '#ffffff', color: 'var(--primary-900)' }}
          >
            <CheckSquare size={16} />
            <span>View Tasks</span>
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => onNavigateToTab('budget')}
          >
            <Coins size={16} />
            <span>Manage Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Planned Budget Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Budget
            </span>
            <Coins size={18} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
            {formatCurrency(focusEvent.totalBudget, focusEvent.currency)}
          </div>
          <div style={{ fontSize: '0.825rem', color: budgetSummary.isOverBudget ? 'var(--danger-600)' : 'var(--text-muted)' }}>
            {budgetSummary.isOverBudget
              ? `Over budget by ${formatCurrency(Math.abs(budgetSummary.remainingBudget), focusEvent.currency)}`
              : `${formatCurrency(budgetSummary.remainingBudget, focusEvent.currency)} remaining`}
          </div>
        </div>

        {/* Task Completion Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Checklist Progress
            </span>
            <CheckCircle2 size={18} style={{ color: 'var(--success-500)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
            {completedTasksCount} / {totalTasksCount}
          </div>
          <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${taskProgressPct}%` }} />
          </div>
        </div>

        {/* Next Important Deadline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Deadline
            </span>
            <Clock size={18} style={{ color: 'var(--warning-500)' }} />
          </div>
          {nextDeadlineTask ? (
            <>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0.5rem 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={nextDeadlineTask.title}
              >
                {nextDeadlineTask.title}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--warning-600)', fontWeight: 600 }}>
                Due {nextDeadlineTask.dueDate}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              All current tasks completed!
            </div>
          )}
        </div>

        {/* Saved Events Summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Saved Events
            </span>
            <Calendar size={18} style={{ color: 'var(--accent-600)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
            {totalSavedEvents}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {upcomingEvents.length} upcoming celebrations
          </div>
        </div>
      </div>

      {/* Main Split Grid: Event Detail Status + Quick Tasks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Event Detail & Progress Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Event Status & Logistics</h2>
            <span className="badge badge-primary">{focusEvent.type}</span>
          </div>

          {focusEvent.overview && (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
                lineHeight: 1.6,
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {focusEvent.overview}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Setting & Atmosphere:</span>
              <span style={{ fontWeight: 600 }}>
                {focusEvent.setting || 'Mixed'} {focusEvent.theme ? `• ${focusEvent.theme}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered Vendors:</span>
              <span style={{ fontWeight: 600 }}>{focusEvent.vendors.length} vendors organized</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Tasks:</span>
              <span style={{ fontWeight: 600 }}>
                {totalTasksCount - completedTasksCount} pending ({overdueTasksCount} overdue, {urgentTasksCount} urgent)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Budget Allocated:</span>
              <span style={{ fontWeight: 600 }}>
                {budgetSummary.plannedUtilizationPercentage}% of limit
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateToTab('vendors')}
            >
              <Building size={14} />
              <span>Vendors ({focusEvent.vendors.length})</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateToTab('ideas')}
            >
              <Sparkles size={14} />
              <span>Ideas ({focusEvent.ideas.length})</span>
            </button>
          </div>
        </div>

        {/* Immediate Tasks & Action Items */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Urgent & Upcoming Tasks</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('timeline')}
            >
              <span>See All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {incompleteTasksSorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--success-500)', marginBottom: '0.5rem' }} />
              <div>No pending tasks for this event!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {incompleteTasksSorted.slice(0, 5).map((task) => {
                const overdue = isTaskOverdue(task);
                const urgent = isTaskUrgent(task);

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: overdue ? 'var(--danger-50)' : 'var(--bg-surface-subtle)',
                      border: `1px solid ${overdue ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: overdue ? 'var(--danger-600)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.category} • Due {task.dueDate}
                      </div>
                    </div>

                    <div>
                      {overdue && (
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                          Overdue
                        </span>
                      )}
                      {!overdue && urgent && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Switch Event Quick Drawer if multiple events exist */}
      {events.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Your Saved Celebrations</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('events')}
            >
              <span>Manage All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${ev.id === focusEvent.id ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                  backgroundColor: ev.id === focusEvent.id ? 'var(--primary-50)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {ev.type}
                  </span>
                  {ev.id === focusEvent.id && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, margin: '0.5rem 0 0.2rem', color: 'var(--primary-900)' }}>
                  {ev.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {ev.date} • {formatCurrency(ev.totalBudget, ev.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
