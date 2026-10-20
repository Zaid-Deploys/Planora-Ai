import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Coins,
  CheckSquare,
  Store,
  Lightbulb,
  Settings,
  X,
} from 'lucide-react';
import { PlanoraLogo } from '../brand/PlanoraLogo';

export type ActiveTab =
  | 'dashboard'
  | 'planner'
  | 'events'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'ideas'
  | 'settings';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  hasActiveEvent: boolean;
  activeEventName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  hasActiveEvent,
  activeEventName,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; requiresEvent?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'planner', label: 'AI Planner', icon: <Sparkles size={18} /> },
    { id: 'events', label: 'My Events', icon: <CalendarDays size={18} /> },
    { id: 'budget', label: 'Budget Planner', icon: <Coins size={18} />, requiresEvent: true },
    { id: 'timeline', label: 'Timeline & Tasks', icon: <CheckSquare size={18} />, requiresEvent: true },
    { id: 'vendors', label: 'Vendor Organizer', icon: <Store size={18} />, requiresEvent: true },
    { id: 'ideas', label: 'Event Ideas', icon: <Lightbulb size={18} />, requiresEvent: true },
    { id: 'settings', label: 'Settings & Data', icon: <Settings size={18} /> },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Main Navigation"
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <PlanoraLogo size="sm" showTagline />
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {hasActiveEvent && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              margin: '0.75rem 1rem 0.25rem',
              backgroundColor: 'var(--primary-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-100)',
            }}
          >
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary-700)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Active Planning Event
            </span>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--primary-900)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={activeEventName}
            >
              {activeEventName}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const isDisabled = item.requiresEvent && !hasActiveEvent;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--primary-900)' : 'transparent',
                    color: isActive ? '#ffffff' : isDisabled ? 'var(--text-subtle)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={isDisabled ? 'Select or create an event to view this section' : undefined}
                >
                  <span
                    style={{
                      color: isActive ? '#ffffff' : isDisabled ? 'var(--text-subtle)' : 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>PromptWars Challenge 5</strong>
            <div>Celebration & Event Planner</div>
          </div>
        </div>
      </aside>
    </>
  );
};
