import React from 'react';
import {
  Download,
  FileCode,
  Printer,
  CheckSquare,
  Coins,
  Store,
} from 'lucide-react';
import { Modal } from './Modal';
import { EventPlan } from '../../types/event';
import {
  exportEventToJson,
  exportBudgetToCsv,
  exportTasksToCsv,
  exportVendorsToCsv,
} from '../../lib/export/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, event }) => {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Celebration Dossier"
      description={`Download structured data or print dossiers for ${event.name}.`}
      maxWidth="md"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Full JSON Export */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
          }}
          onClick={() => {
            exportEventToJson(event);
            onClose();
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-700)', marginBottom: '0.4rem' }}>
              <FileCode size={20} />
              <div style={{ fontWeight: 700 }}>Complete Event (JSON)</div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Raw structured JSON including metadata, budget allocations, tasks, vendors, and ideas.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            <Download size={13} />
            <span>Download JSON</span>
          </button>
        </div>

        {/* Budget CSV Export */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
          }}
          onClick={() => {
            exportBudgetToCsv(event);
            onClose();
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-600)', marginBottom: '0.4rem' }}>
              <Coins size={20} />
              <div style={{ fontWeight: 700 }}>Budget & Expenses (CSV)</div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Spreadsheet format with category allocations, estimated vs actual expenses, and payment status.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            <Download size={13} />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Tasks CSV Export */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
          }}
          onClick={() => {
            exportTasksToCsv(event);
            onClose();
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-600)', marginBottom: '0.4rem' }}>
              <CheckSquare size={20} />
              <div style={{ fontWeight: 700 }}>Task Checklist (CSV)</div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Checklist of milestones with due dates, urgency priorities, and completion status.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            <Download size={13} />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Vendors CSV Export */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
          }}
          onClick={() => {
            exportVendorsToCsv(event);
            onClose();
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-600)', marginBottom: '0.4rem' }}>
              <Store size={20} />
              <div style={{ fontWeight: 700 }}>Vendor Directory (CSV)</div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Vendor directory with contact info, quoted prices, and booking status.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            <Download size={13} />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Print Dossier */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
            gridColumn: '1 / -1',
          }}
          onClick={() => {
            onClose();
            setTimeout(() => window.print(), 100);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={20} style={{ color: 'var(--primary-700)' }} />
              <div>
                <div style={{ fontWeight: 700 }}>Print-Friendly Dossier</div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Generates an executive printout of your event overview, budget, timeline, and vendors.
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm">
              Print Now
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
