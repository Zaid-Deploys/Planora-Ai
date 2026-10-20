import React, { useState } from 'react';
import {
  Calendar,
  Trash2,
  Download,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Users,
  Coins,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { formatCurrency } from '../../lib/budget/calculations';
import { exportEventToJson } from '../../lib/export/formatters';
import { Modal } from '../../components/common/Modal';

interface EventListViewProps {
  events: EventPlan[];
  activeEventId: string | null;
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const EventListView: React.FC<EventListViewProps> = ({
  events,
  activeEventId,
  onSelectEvent,
  onDeleteEvent,
  onOpenCreateModal,
}) => {
  const [eventToDelete, setEventToDelete] = useState<EventPlan | null>(null);

  const confirmDelete = () => {
    if (eventToDelete) {
      onDeleteEvent(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Calendar size={48} style={{ color: 'var(--primary-600)', marginBottom: '1rem' }} />
        <h2>No Saved Celebrations Yet</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem auto 1.5rem', maxWidth: '420px' }}>
          Create an event with Planora AI to organize budgets, vendor directories, and checklists.
        </p>
        <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
          <PlusCircle size={16} />
          <span>Create an Event</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>My Celebrations & Events</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage and switch between your planned celebrations.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
          <PlusCircle size={16} />
          <span>New Event</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {events.map((event) => {
          const isActive = event.id === activeEventId;

          return (
            <div
              key={event.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `2px solid ${isActive ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                backgroundColor: isActive ? 'var(--primary-50)' : 'var(--bg-surface)',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{event.type}</span>
                    {event.isAiGenerated && (
                      <span className="badge" style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent-700)' }}>
                        <Sparkles size={11} />
                        AI Generated
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary-700)',
                        backgroundColor: '#ffffff',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--primary-100)',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: '1.2rem',
                    marginBottom: '0.5rem',
                    color: 'var(--primary-900)',
                  }}
                >
                  {event.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{event.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{event.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{event.guestCount} Guests</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Coins size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 600 }}>{formatCurrency(event.totalBudget, event.currency)}</span>
                  </div>
                </div>

                {event.overview && (
                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.75rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {event.overview}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  marginTop: '1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => exportEventToJson(event)}
                    title="Export event as JSON"
                    aria-label={`Export ${event.name} as JSON`}
                  >
                    <Download size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-600)' }}
                    onClick={() => setEventToDelete(event)}
                    title="Delete celebration plan"
                    aria-label={`Delete ${event.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {!isActive ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <span>Open Plan</span>
                    <ExternalLink size={13} />
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                    Currently Editing
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Event Deletion */}
      <Modal
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        title="Confirm Delete Celebration"
        description="Are you sure you want to remove this event plan?"
        maxWidth="sm"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEventToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmDelete}
              id="confirm-delete-event-btn"
            >
              Delete Event
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} style={{ color: 'var(--danger-500)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Permanently delete "{eventToDelete?.name}"?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              This will remove all associated tasks, budget allocations, expenses, and vendor records
              from your browser storage. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
