import React from 'react';
import { Menu, Plus, Printer, Calendar, ChevronDown, Download } from 'lucide-react';
import { EventPlan } from '../../types/event';

interface HeaderProps {
  activeEvent: EventPlan | null;
  eventsCount: number;
  onOpenCreateModal: () => void;
  onOpenEventListModal: () => void;
  onOpenExportModal: () => void;
  onToggleMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeEvent,
  eventsCount,
  onOpenCreateModal,
  onOpenEventListModal,
  onOpenExportModal,
  onToggleMobileNav,
}) => {
  return (
    <header className="app-header" role="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {activeEvent ? (
          <button
            type="button"
            onClick={onOpenEventListModal}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
            aria-label={`Current event: ${activeEvent.name}. Click to switch event.`}
          >
            <Calendar size={15} style={{ color: 'var(--primary-600)' }} />
            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeEvent.name}
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
              {activeEvent.type}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        ) : (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {eventsCount === 0 ? 'No events created yet' : 'Select an event'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {activeEvent && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => window.print()}
              aria-label="Print event summary dossier"
              title="Print event summary"
            >
              <Printer size={15} />
              <span className="hide-on-mobile">Print Plan</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={onOpenExportModal}
              aria-label="Export event data"
              title="Export event data"
            >
              <Download size={15} />
              <span className="hide-on-mobile">Export</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenCreateModal}
          aria-label="Create a new celebration plan"
        >
          <Plus size={16} />
          <span>New Event</span>
        </button>
      </div>
    </header>
  );
};
