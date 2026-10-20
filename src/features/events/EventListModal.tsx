import React from 'react';
import { PlusCircle, Check } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { EventPlan } from '../../types/event';
import { formatCurrency } from '../../lib/budget/calculations';

interface EventListModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventPlan[];
  activeEventId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const EventListModal: React.FC<EventListModalProps> = ({
  isOpen,
  onClose,
  events,
  activeEventId,
  onSelectEvent,
  onOpenCreateModal,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Celebration"
      description="Select an event to view and manage its budget, tasks, and vendors."
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
          >
            <PlusCircle size={15} />
            <span>Create Another Event</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {events.map((event) => {
          const isSelected = event.id === activeEventId;

          return (
            <div
              key={event.id}
              onClick={() => {
                onSelectEvent(event.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                    {event.name}
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {event.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {event.date} • {event.location} • {formatCurrency(event.totalBudget, event.currency)}
                </div>
              </div>

              {isSelected && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-600)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
