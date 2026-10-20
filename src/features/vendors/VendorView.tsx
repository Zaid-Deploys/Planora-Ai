import React, { useState, useMemo } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  Download,
  Coins,
  Award,
} from 'lucide-react';
import { EventPlan, VendorItem, VendorStatus } from '../../types/event';
import { formatCurrency } from '../../lib/budget/calculations';
import { isValidHttpUrl } from '../../lib/validation/schemas';
import { exportVendorsToCsv } from '../../lib/export/formatters';
import { Modal } from '../../components/common/Modal';

interface VendorViewProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const VendorView: React.FC<VendorViewProps> = ({ event, onUpdateEvent }) => {
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Venue');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [quotedPrice, setQuotedPrice] = useState<number | ''>('');
  const [status, setStatus] = useState<VendorStatus>('inquired');
  const [notes, setNotes] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all');
  const [showComparison, setShowComparison] = useState(false);

  const categories = useMemo(() => {
    const list = ['Venue', 'Catering', 'Photography', 'Decor', 'Entertainment', 'Attire', 'Transport', 'Other'];
    return list;
  }, []);

  const filteredVendors = useMemo(() => {
    return event.vendors.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      return true;
    });
  }, [event.vendors, categoryFilter, statusFilter]);

  const shortlistedVendors = useMemo(() => {
    return event.vendors.filter((v) => v.status === 'shortlisted' || v.status === 'booked');
  }, [event.vendors]);

  const handleOpenAddVendor = () => {
    setEditingVendorId(null);
    setName('');
    setCategory('Venue');
    setContactName('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setQuotedPrice('');
    setStatus('inquired');
    setNotes('');
    setUrlError(null);
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (v: VendorItem) => {
    setEditingVendorId(v.id);
    setName(v.name);
    setCategory(v.category);
    setContactName(v.contactName || '');
    setPhone(v.phone || '');
    setEmail(v.email || '');
    setWebsite(v.website || '');
    setQuotedPrice(typeof v.quotedPrice === 'number' ? v.quotedPrice : '');
    setStatus(v.status);
    setNotes(v.notes || '');
    setUrlError(null);
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Security check on website URL
    if (website.trim() && !isValidHttpUrl(website.trim())) {
      setUrlError('Website must start with http:// or https://');
      return;
    }

    const price = typeof quotedPrice === 'number' ? quotedPrice : undefined;

    let updatedVendors: VendorItem[];
    if (editingVendorId) {
      updatedVendors = event.vendors.map((v) =>
        v.id === editingVendorId
          ? {
              ...v,
              name: name.trim(),
              category,
              contactName: contactName.trim() || undefined,
              phone: phone.trim() || undefined,
              email: email.trim() || undefined,
              website: website.trim() || undefined,
              quotedPrice: price,
              status,
              notes: notes.trim() || undefined,
            }
          : v
      );
    } else {
      const newVendor: VendorItem = {
        id: `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        category,
        contactName: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        quotedPrice: price,
        status,
        notes: notes.trim() || undefined,
      };
      updatedVendors = [...event.vendors, newVendor];
    }

    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    });

    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = (id: string) => {
    const updatedVendors = event.vendors.filter((v) => v.id !== id);
    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickStatusChange = (vendorId: string, newStatus: VendorStatus) => {
    const updatedVendors = event.vendors.map((v) =>
      v.id === vendorId ? { ...v, status: newStatus } : v
    );
    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    });
  };

  const getStatusBadgeClass = (s: VendorStatus) => {
    switch (s) {
      case 'booked':
        return 'badge-success';
      case 'shortlisted':
        return 'badge-primary';
      case 'contacted':
        return 'badge-warning';
      case 'declined':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Vendor Directory & Comparison</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track inquiries, quotations, and contracts for {event.name}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {shortlistedVendors.length > 1 && (
            <button
              type="button"
              className={`btn btn-sm ${showComparison ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowComparison(!showComparison)}
            >
              <Award size={14} />
              <span>{showComparison ? 'Hide Comparison' : `Compare Shortlist (${shortlistedVendors.length})`}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportVendorsToCsv(event)}
            title="Download vendor directory as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddVendor}
            id="add-vendor-btn"
          >
            <Plus size={15} />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Shortlist Comparison Section */}
      {showComparison && shortlistedVendors.length > 0 && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '2px solid var(--primary-100)',
            padding: '1.5rem',
          }}
        >
          <div className="card-header">
            <div>
              <h2 className="card-title">Shortlisted Vendor Comparison</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Compare quoted rates and terms across candidate partners before contract signing.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Quoted Fee</th>
                  <th>Status</th>
                  <th>Contact Info</th>
                  <th>Notes & Terms</th>
                </tr>
              </thead>
              <tbody>
                {shortlistedVendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700 }}>{v.name}</td>
                    <td>
                      <span className="badge badge-neutral">{v.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                      {typeof v.quotedPrice === 'number'
                        ? formatCurrency(v.quotedPrice, event.currency)
                        : 'Awaiting Quote'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {v.contactName && <div>{v.contactName}</div>}
                      {v.phone && <div>{v.phone}</div>}
                      {v.email && <div>{v.email}</div>}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {v.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category & Status Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface-subtle)',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Filter Vendors:
        </span>

        <select
          className="select"
          style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter vendors by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="select"
          style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | VendorStatus)}
          aria-label="Filter vendors by status"
        >
          <option value="all">All Statuses</option>
          <option value="inquired">Inquired</option>
          <option value="contacted">Contacted</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="booked">Booked / Signed</option>
          <option value="declined">Declined</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredVendors.length} of {event.vendors.length} vendors
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Store size={44} style={{ color: 'var(--primary-600)', marginBottom: '0.75rem' }} />
          <h3>No Vendors Recorded Yet</h3>
          <p style={{ maxWidth: '440px', margin: '0.5rem auto 1.5rem', fontSize: '0.875rem' }}>
            Keep your caterers, venues, decorators, and photographers organized with quoted pricing
            and booking status.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddVendor}
          >
            <Plus size={16} />
            <span>Add First Vendor</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredVendors.map((v) => (
            <div
              key={v.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-neutral">{v.category}</span>
                  <select
                    className="select"
                    style={{
                      width: 'auto',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.75rem',
                      height: 'auto',
                      fontWeight: 600,
                    }}
                    value={v.status}
                    onChange={(e) => handleQuickStatusChange(v.id, e.target.value as VendorStatus)}
                    aria-label={`Change status for ${v.name}`}
                  >
                    <option value="inquired">Inquired</option>
                    <option value="contacted">Contacted</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="booked">Booked</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                  {v.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {typeof v.quotedPrice === 'number' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Coins size={14} style={{ color: 'var(--primary-600)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        Quoted: {formatCurrency(v.quotedPrice, event.currency)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No price quoted yet
                    </div>
                  )}

                  {v.contactName && <div>Contact: {v.contactName}</div>}

                  {v.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{v.phone}</span>
                    </div>
                  )}

                  {v.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{v.email}</span>
                    </div>
                  )}

                  {v.website && isValidHttpUrl(v.website) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ExternalLink size={13} style={{ color: 'var(--primary-600)' }} />
                      <a
                        href={v.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary-600)', textDecoration: 'none' }}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {v.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      {v.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  paddingTop: '0.85rem',
                  marginTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEditVendor(v)}
                  aria-label={`Edit ${v.name}`}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger-600)' }}
                  onClick={() => handleDeleteVendor(v.id)}
                  aria-label={`Delete ${v.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title={editingVendorId ? 'Edit Vendor Record' : 'Add Vendor Record'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveVendor}>
          <div className="form-group">
            <label htmlFor="vendor-name" className="form-label form-label-required">
              Business / Vendor Name
            </label>
            <input
              id="vendor-name"
              type="text"
              className="input"
              placeholder="e.g. Royal Palaces Events, Gourmet Catering Co."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="vendor-category" className="form-label form-label-required">
                Category
              </label>
              <select
                id="vendor-category"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vendor-status" className="form-label">
                Booking Status
              </label>
              <select
                id="vendor-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
              >
                <option value="inquired">Inquired</option>
                <option value="contacted">Contacted</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="booked">Booked</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="vendor-contact" className="form-label">
                Contact Person Name
              </label>
              <input
                id="vendor-contact"
                type="text"
                className="input"
                placeholder="e.g. Priya Sharma"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor-price" className="form-label">
                Quoted Price ({event.currency})
              </label>
              <input
                id="vendor-price"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 75000"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="vendor-phone" className="form-label">
                Phone Number
              </label>
              <input
                id="vendor-phone"
                type="text"
                className="input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor-email" className="form-label">
                Email Address
              </label>
              <input
                id="vendor-email"
                type="email"
                className="input"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-url" className="form-label">
              Website URL (Optional)
            </label>
            <input
              id="vendor-url"
              type="url"
              className={`input ${urlError ? 'error' : ''}`}
              placeholder="https://example.com"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                setUrlError(null);
              }}
            />
            {urlError && <div className="form-error">{urlError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="vendor-notes" className="form-label">
              Notes & Contract Terms
            </label>
            <textarea
              id="vendor-notes"
              className="textarea"
              placeholder="Inclusions, package breakdown, cancellation policy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsVendorModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="save-vendor-btn">
              {editingVendorId ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
