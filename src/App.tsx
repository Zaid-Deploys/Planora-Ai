import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { PlannerView } from './features/planner/PlannerView';
import { EventListView } from './features/events/EventListView';
import { BudgetView } from './features/budget/BudgetView';
import { TimelineView } from './features/timeline/TimelineView';
import { VendorView } from './features/vendors/VendorView';
import { IdeasView } from './features/ideas/IdeasView';
import { SettingsView } from './features/settings/SettingsView';
import { EventCreateModal } from './features/events/EventCreateModal';
import { EventReviewModal } from './features/events/EventReviewModal';
import { EventListModal } from './features/events/EventListModal';
import { ExportModal } from './components/common/ExportModal';
import { EventPlan, StoredAppState } from './types/event';
import { loadAppState, saveAppState } from './lib/storage/localStorage';
import { formatCurrency } from './lib/budget/calculations';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<StoredAppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEventListModalOpen, setIsEventListModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pendingReviewPlan, setPendingReviewPlan] = useState<EventPlan | null>(null);

  // Synchronize state changes to localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  const activeEvent =
    appState.events.find((e) => e.id === appState.activeEventId) || appState.events[0] || null;

  const handleSelectEvent = (eventId: string) => {
    setAppState((prev) => ({
      ...prev,
      activeEventId: eventId,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleUpdateEvent = (updated: EventPlan) => {
    setAppState((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === updated.id ? updated : e)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleDeleteEvent = (eventId: string) => {
    setAppState((prev) => {
      const remaining = prev.events.filter((e) => e.id !== eventId);
      const newActive =
        prev.activeEventId === eventId ? remaining[0]?.id || null : prev.activeEventId;
      return {
        ...prev,
        events: remaining,
        activeEventId: newActive,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handlePlanReadyForReview = (newPlan: EventPlan) => {
    setPendingReviewPlan(newPlan);
  };

  const handleSaveReviewedPlan = (finalPlan: EventPlan) => {
    setAppState((prev) => {
      // If plan already existed, update; otherwise prepend
      const existingIndex = prev.events.findIndex((e) => e.id === finalPlan.id);
      let updatedEvents: EventPlan[];
      if (existingIndex >= 0) {
        updatedEvents = prev.events.map((e) => (e.id === finalPlan.id ? finalPlan : e));
      } else {
        updatedEvents = [finalPlan, ...prev.events];
      }

      return {
        ...prev,
        events: updatedEvents,
        activeEventId: finalPlan.id,
        lastUpdated: new Date().toISOString(),
      };
    });

    setPendingReviewPlan(null);
    setCurrentTab('dashboard');
  };

  const handleReloadState = () => {
    const loaded = loadAppState();
    setAppState(loaded);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        hasActiveEvent={activeEvent !== null}
        activeEventName={activeEvent?.name}
      />

      <div className="app-main">
        {/* Header Bar */}
        <Header
          activeEvent={activeEvent}
          eventsCount={appState.events.length}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenEventListModal={() => setIsEventListModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {/* Print Only Header Banner */}
        {activeEvent && (
          <div className="print-only-header">
            <h1 style={{ fontSize: '24pt', margin: 0 }}>{activeEvent.name} — Event Dossier</h1>
            <div style={{ fontSize: '12pt', color: '#555', marginTop: '4pt' }}>
              Planora AI • {activeEvent.type.toUpperCase()} • Date: {activeEvent.date} • Location: {activeEvent.location} • Budget: {formatCurrency(activeEvent.totalBudget, activeEvent.currency)}
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="app-content" role="main">
          {currentTab === 'dashboard' && (
            <DashboardView
              events={appState.events}
              activeEvent={activeEvent}
              onSelectEvent={handleSelectEvent}
              onNavigateToTab={(tab) => setCurrentTab(tab as ActiveTab)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentTab === 'planner' && (
            <PlannerView
              activeEvent={activeEvent}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onNavigateToTab={(tab) => setCurrentTab(tab as ActiveTab)}
            />
          )}

          {currentTab === 'events' && (
            <EventListView
              events={appState.events}
              activeEventId={appState.activeEventId}
              onSelectEvent={handleSelectEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentTab === 'budget' && activeEvent && (
            <BudgetView event={activeEvent} onUpdateEvent={handleUpdateEvent} />
          )}

          {currentTab === 'timeline' && activeEvent && (
            <TimelineView event={activeEvent} onUpdateEvent={handleUpdateEvent} />
          )}

          {currentTab === 'vendors' && activeEvent && (
            <VendorView event={activeEvent} onUpdateEvent={handleUpdateEvent} />
          )}

          {currentTab === 'ideas' && activeEvent && (
            <IdeasView event={activeEvent} onUpdateEvent={handleUpdateEvent} />
          )}

          {currentTab === 'settings' && (
            <SettingsView events={appState.events} onReloadState={handleReloadState} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <EventCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPlanReadyForReview={handlePlanReadyForReview}
      />

      <EventReviewModal
        isOpen={pendingReviewPlan !== null}
        plan={pendingReviewPlan}
        onSave={handleSaveReviewedPlan}
        onClose={() => setPendingReviewPlan(null)}
      />

      <EventListModal
        isOpen={isEventListModalOpen}
        onClose={() => setIsEventListModalOpen(false)}
        events={appState.events}
        activeEventId={appState.activeEventId}
        onSelectEvent={handleSelectEvent}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        event={activeEvent}
      />
    </div>
  );
};
