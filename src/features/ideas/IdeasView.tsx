import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  Tag,
  Info,
} from 'lucide-react';
import { EventPlan, IdeaItem, IdeaCategory } from '../../types/event';
import { Modal } from '../../components/common/Modal';

interface IdeasViewProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ event, onUpdateEvent }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | IdeaCategory>('all');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Modal to add a new custom idea
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<IdeaCategory>('theme');
  const [ideaTags, setIdeaTags] = useState('');

  const categories: { id: IdeaCategory; label: string }[] = [
    { id: 'theme', label: 'Theme & Decor' },
    { id: 'food', label: 'Food & Menus' },
    { id: 'activity', label: 'Guest Activities' },
    { id: 'invitation', label: 'Invitations' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'budget_friendly', label: 'Budget Alternatives' },
    { id: 'accessibility', label: 'Accessibility Arrangements' },
    { id: 'weather', label: 'Weather Contingency' },
  ];

  const filteredIdeas = useMemo(() => {
    return event.ideas.filter((idea) => {
      if (showSavedOnly && !idea.saved) return false;
      if (selectedCategory !== 'all' && idea.category !== selectedCategory) return false;
      return true;
    });
  }, [event.ideas, selectedCategory, showSavedOnly]);

  const handleToggleSave = (ideaId: string) => {
    const updated = event.ideas.map((item) =>
      item.id === ideaId ? { ...item, saved: !item.saved } : item
    );
    onUpdateEvent({
      ...event,
      ideas: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteIdea = (ideaId: string) => {
    const updated = event.ideas.filter((item) => item.id !== ideaId);
    onUpdateEvent({
      ...event,
      ideas: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCustomIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    const tagsArray = ideaTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newIdea: IdeaItem = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: ideaCategory,
      title: ideaTitle.trim(),
      description: ideaDescription.trim(),
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      saved: true,
    };

    onUpdateEvent({
      ...event,
      ideas: [...event.ideas, newIdea],
      updatedAt: new Date().toISOString(),
    });

    setIdeaTitle('');
    setIdeaDescription('');
    setIdeaCategory('theme');
    setIdeaTags('');
    setIsIdeaModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Curated Celebration Ideas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Creative concepts, menu suggestions, and contingency inspiration for {event.name}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsIdeaModalOpen(true)}
          id="add-custom-idea-btn"
        >
          <Plus size={15} />
          <span>Save Custom Idea</span>
        </button>
      </div>

      {/* Accuracy / Guidance Disclaimer */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--info-50)',
          border: '1px solid var(--info-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--primary-900)',
        }}
      >
        <Info size={18} style={{ color: 'var(--info-600)', flexShrink: 0 }} />
        <div>
          <strong>Creative Suggestions:</strong> All suggested themes, menu items, and activities are
          generative concepts designed for inspiration. Availability, pricing, and permits must be
          verified with local service providers.
        </div>
      </div>

      {/* Filter Tabs & Bookmarked Toggle */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface-subtle)',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${selectedCategory === 'all' && !showSavedOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setSelectedCategory('all');
            setShowSavedOnly(false);
          }}
        >
          All Ideas ({event.ideas.length})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${showSavedOnly ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setShowSavedOnly(!showSavedOnly)}
        >
          <Bookmark size={13} />
          <span>Bookmarked ({event.ideas.filter((i) => i.saved).length})</span>
        </button>

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-default)', margin: '0 0.25rem' }} />

        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn btn-sm ${selectedCategory === c.id && !showSavedOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSelectedCategory(c.id);
              setShowSavedOnly(false);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Lightbulb size={40} style={{ color: 'var(--primary-600)', marginBottom: '0.75rem' }} />
          <h3>No Ideas Found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem', fontSize: '0.875rem' }}>
            {showSavedOnly
              ? 'You have not bookmarked any ideas yet. Click the bookmark icon on any card to save it.'
              : 'Add your own custom celebration inspiration.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsIdeaModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add Custom Idea</span>
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
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                    {idea.category.replace('_', ' ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleSave(idea.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      color: idea.saved ? 'var(--accent-600)' : 'var(--text-subtle)',
                    }}
                    title={idea.saved ? 'Remove bookmark' : 'Bookmark idea'}
                    aria-label={`Bookmark ${idea.title}`}
                  >
                    {idea.saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                  </button>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                  {idea.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {idea.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.85rem',
                  marginTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {idea.tags && idea.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        color: 'var(--text-muted)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger-600)', padding: '0.25rem 0.45rem' }}
                  onClick={() => handleDeleteIdea(idea.id)}
                  title="Delete idea"
                  aria-label={`Delete ${idea.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Idea Modal */}
      <Modal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        title="Add Creative Celebration Idea"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomIdea}>
          <div className="form-group">
            <label htmlFor="idea-title" className="form-label form-label-required">
              Idea Title
            </label>
            <input
              id="idea-title"
              type="text"
              className="input"
              placeholder="e.g. Polaroid Guestbook Station, Regional Street Food Live Counters"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idea-category" className="form-label form-label-required">
              Category
            </label>
            <select
              id="idea-category"
              className="select"
              value={ideaCategory}
              onChange={(e) => setIdeaCategory(e.target.value as IdeaCategory)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idea-desc" className="form-label form-label-required">
              Description & Logistics
            </label>
            <textarea
              id="idea-desc"
              className="textarea"
              placeholder="Describe how to execute this creative idea..."
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idea-tags" className="form-label">
              Tags (comma separated)
            </label>
            <input
              id="idea-tags"
              type="text"
              className="input"
              placeholder="e.g. Interactive, Low-Cost, Photo-Op"
              value={ideaTags}
              onChange={(e) => setIdeaTags(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsIdeaModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="save-custom-idea-btn">
              Save Idea
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
