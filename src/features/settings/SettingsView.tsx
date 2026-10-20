import React, { useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Database,
} from 'lucide-react';
import { EventPlan, StoredAppState } from '../../types/event';
import { exportAllEventsToJson } from '../../lib/export/formatters';
import { clearAppState, saveAppState, isValidEventPlan } from '../../lib/storage/localStorage';
import { Modal } from '../../components/common/Modal';

interface SettingsViewProps {
  events: EventPlan[];
  onReloadState: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ events, onReloadState }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExportBackup = () => {
    exportAllEventsToJson(events);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let candidateEvents: EventPlan[] = [];
        if (Array.isArray(parsed)) {
          candidateEvents = parsed.filter(isValidEventPlan);
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.events)) {
          candidateEvents = parsed.events.filter(isValidEventPlan);
        }

        if (candidateEvents.length === 0) {
          setImportMessage({
            text: 'Import failed: The selected file does not contain valid Planora AI celebration plans.',
            type: 'error',
          });
          return;
        }

        const newState: StoredAppState = {
          version: 1,
          events: candidateEvents,
          activeEventId: candidateEvents[0]?.id || null,
          lastUpdated: new Date().toISOString(),
        };

        saveAppState(newState);
        setImportMessage({
          text: `Successfully imported ${candidateEvents.length} celebration plans!`,
          type: 'success',
        });
        onReloadState();
      } catch (err) {
        setImportMessage({
          text: 'Import failed: Unable to parse file as valid JSON.',
          type: 'error',
        });
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = () => {
    clearAppState();
    setIsResetModalOpen(false);
    onReloadState();
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2>Settings & Data Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Manage local browser persistence, export backups, and view privacy architecture.
        </p>
      </div>

      {importMessage && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: importMessage.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
            border: `1px solid ${importMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: importMessage.type === 'success' ? 'var(--success-600)' : 'var(--danger-600)',
          }}
        >
          {importMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{importMessage.text}</span>
        </div>
      )}

      {/* Local Storage & Privacy Disclosure */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} style={{ color: 'var(--primary-600)' }} />
            <h3 className="card-title">Browser Local Persistence</h3>
          </div>
          <span className="badge badge-success">Local Sandbox</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Planora AI uses browser-local storage (<code>localStorage</code>, namespace{' '}
          <code>planora_ai_state_v1</code>). Your celebration details, budgets, checklists, and vendor
          contacts reside exclusively on this device. Data is <strong>not</strong> synchronized across
          different browsers or uploaded to an external database.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            alignItems: 'center',
          }}
        >
          <Shield size={20} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Security Guarantee:</strong> API keys, server tokens, and credentials are{' '}
            <em>never</em> stored in your browser or persisted in client-side storage.
          </div>
        </div>
      </div>

      {/* Backup & Restore Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Backup & Restore</h3>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Safely export all your saved celebrations into a portable JSON backup file, or restore
          plans from an existing backup.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportBackup}
            disabled={events.length === 0}
          >
            <Download size={16} />
            <span>Export Backup ({events.length} Events)</span>
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>Restore from Backup</span>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>

      {/* Gemini AI Server Configuration Guide */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-600)' }} />
            <h3 className="card-title">Google Gemini Integration Architecture</h3>
          </div>
          <span className="badge badge-primary">Server-Side Only</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          AI plan generation requests are dispatched to <code>/api/plan</code>, where Google Gemini is
          invoked using official Google Gen AI SDKs.
        </p>

        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '1rem',
          }}
        >
          <div>GEMINI_API_KEY=your_api_key_here</div>
          <div>GEMINI_MODEL=gemini-2.5-flash</div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          To run AI planning in production, configure these variables in your Vercel project
          settings. For local development, copy <code>.env.example</code> to <code>.env</code>.
          If no API key is set, deterministic starter checklists and all local budget calculators
          continue to operate seamlessly.
        </p>
      </div>

      {/* Factory Reset */}
      <div className="card" style={{ borderColor: 'var(--danger-border)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--danger-600)' }}>
            Reset Application Data
          </h3>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Erase all events, budget allocations, checklists, and vendor records from browser
          storage. This action cannot be reversed.
        </p>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => setIsResetModalOpen(true)}
          id="open-reset-modal-btn"
        >
          <Trash2 size={14} />
          <span>Reset All Stored Data</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Application Reset"
        description="Are you sure you want to clear all stored celebrations?"
        maxWidth="sm"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmReset}
              id="confirm-full-reset-btn"
            >
              Confirm Full Reset
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} style={{ color: 'var(--danger-500)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            This will permanently delete all {events.length} saved celebration plans from your
            browser. Please ensure you have exported a JSON backup if you wish to retain your data.
          </div>
        </div>
      </Modal>

      {/* About Box */}
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', paddingBottom: '2rem' }}>
        <strong>Planora AI</strong> — PromptWars Challenge 5: Celebration & Event Planner
        <div>Built with React, TypeScript, Vite, and Google Gemini.</div>
      </div>
    </div>
  );
};
