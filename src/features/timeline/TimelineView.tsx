import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Download,
  Filter,
  Sparkles,
} from 'lucide-react';
import { EventPlan, TaskItem, TaskPriority, TaskStatus } from '../../types/event';
import { isTaskOverdue, isTaskUrgent, generateDeterministicStarterTasks } from '../../lib/timeline/generator';
import { exportTasksToCsv } from '../../lib/export/formatters';
import { Modal } from '../../components/common/Modal';

interface TimelineViewProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ event, onUpdateEvent }) => {
  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'priority'>('date_asc');

  // Modal states for Task Add/Edit
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('not_started');
  const [taskNotes, setTaskNotes] = useState('');

  // Categories list
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    event.tasks.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [event.tasks]);

  // Overall metrics
  const totalTasks = event.tasks.length;
  const completedTasks = event.tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = event.tasks.filter((t) => isTaskOverdue(t)).length;
  const urgentTasks = event.tasks.filter((t) => isTaskUrgent(t)).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered & Sorted task list
  const filteredTasks = useMemo(() => {
    return event.tasks
      .filter((task) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') return a.dueDate.localeCompare(b.dueDate);
        if (sortBy === 'date_desc') return b.dueDate.localeCompare(a.dueDate);
        if (sortBy === 'priority') {
          const priorityWeight: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
      });
  }, [event.tasks, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const handleToggleTaskStatus = (task: TaskItem) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
    const updatedTasks = event.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t));
    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOpenAddTask = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskCategory('General');
    setTaskDueDate(event.date);
    setTaskPriority('medium');
    setTaskStatus('not_started');
    setTaskNotes('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskCategory(task.category);
    setTaskDueDate(task.dueDate);
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskNotes(task.notes || '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;

    let updatedTasks: TaskItem[];

    if (editingTaskId) {
      updatedTasks = event.tasks.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: taskTitle.trim(),
              description: taskDescription.trim() || undefined,
              category: taskCategory.trim() || 'General',
              dueDate: taskDueDate,
              priority: taskPriority,
              status: taskStatus,
              notes: taskNotes.trim() || undefined,
            }
          : t
      );
    } else {
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        category: taskCategory.trim() || 'General',
        dueDate: taskDueDate,
        priority: taskPriority,
        status: taskStatus,
        notes: taskNotes.trim() || undefined,
        isAiGenerated: false,
      };
      updatedTasks = [...event.tasks, newTask];
    }

    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });

    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = event.tasks.filter((t) => t.id !== id);
    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAppendStarterTasks = () => {
    const starters = generateDeterministicStarterTasks({
      type: event.type,
      date: event.date,
      setting: event.setting,
      guestCount: event.guestCount,
      accessibilityNeeds: event.accessibilityNeeds,
    });

    // Merge without replacing existing tasks
    onUpdateEvent({
      ...event,
      tasks: [...event.tasks, ...starters],
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Timeline & Checklist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Actionable milestones for {event.name} on {event.date}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportTasksToCsv(event)}
            title="Download task checklist as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddTask}
            id="add-custom-task-btn"
          >
            <Plus size={15} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress & Urgency Status Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>
            Planning Progress: {progressPct}% Completed ({completedTasks} of {totalTasks} tasks)
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
            {overdueTasks > 0 && (
              <span className="badge badge-danger">
                <AlertTriangle size={12} />
                {overdueTasks} Overdue
              </span>
            )}
            {urgentTasks > 0 && (
              <span className="badge badge-warning">
                <Clock size={12} />
                {urgentTasks} Due Soon
              </span>
            )}
          </div>
        </div>

        <div className="progress-bar-bg" style={{ height: '10px' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Filter size={15} />
          <span>Filters:</span>
        </div>

        <select
          className="select"
          style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
          aria-label="Filter by task status"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="select"
          style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
          aria-label="Filter by task priority"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {existingCategories.length > 1 && (
          <select
            className="select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {existingCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort:</span>
          <select
            className="select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date_asc' | 'date_desc' | 'priority')}
            aria-label="Sort tasks"
          >
            <option value="date_asc">Due Date (Earliest First)</option>
            <option value="date_desc">Due Date (Latest First)</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckSquare size={36} style={{ color: 'var(--primary-600)', marginBottom: '0.5rem' }} />
          <h3>No Tasks Match Current Filters</h3>
          <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Adjust your filter criteria or generate starter planning items.
          </p>
          {event.tasks.length === 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAppendStarterTasks}
              >
                <Plus size={14} />
                <span>Load Starter Checklist</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddTask}
              >
                <Plus size={14} />
                <span>Add Custom Task</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const overdue = isTaskOverdue(task);
            const urgent = isTaskUrgent(task);

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  backgroundColor: isCompleted
                    ? 'var(--bg-surface-subtle)'
                    : overdue
                    ? 'var(--danger-50)'
                    : 'var(--bg-surface)',
                  borderColor: overdue && !isCompleted ? 'var(--danger-border)' : 'var(--border-subtle)',
                  opacity: isCompleted ? 0.75 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(task)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: isCompleted ? 'var(--success-600)' : 'var(--border-strong)',
                      marginTop: '2px',
                    }}
                    aria-label={`Mark task "${task.title}" as ${isCompleted ? 'incomplete' : 'completed'}`}
                  >
                    {isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.975rem',
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>

                      {task.isAiGenerated && (
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.65rem',
                            backgroundColor: 'var(--accent-50)',
                            color: 'var(--accent-700)',
                            padding: '0.1rem 0.4rem',
                          }}
                        >
                          <Sparkles size={10} />
                          AI
                        </span>
                      )}

                      <span
                        className={`badge ${
                          task.priority === 'urgent'
                            ? 'badge-danger'
                            : task.priority === 'high'
                            ? 'badge-warning'
                            : 'badge-primary'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {task.priority}
                      </span>

                      {overdue && !isCompleted && (
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                          Overdue
                        </span>
                      )}

                      {!overdue && urgent && !isCompleted && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Due in 3 Days
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.25rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Category: {task.category}</span>
                      <span>Due: {task.dueDate}</span>
                      {task.notes && <span>Notes: {task.notes}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEditTask(task)}
                    title="Edit task details"
                    aria-label={`Edit task ${task.title}`}
                    style={{ padding: '0.35rem 0.5rem' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-600)', padding: '0.35rem 0.5rem' }}
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete task"
                    aria-label={`Delete task ${task.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTaskId ? 'Edit Milestone Task' : 'Add Milestone Task'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTask}>
          <div className="form-group">
            <label htmlFor="task-title" className="form-label form-label-required">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              className="input"
              placeholder="e.g. Schedule venue walkthrough, Finalize cake tasting"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc" className="form-label">
              Description & Action Steps
            </label>
            <textarea
              id="task-desc"
              className="textarea"
              placeholder="Detailed instructions or specifications..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="task-category" className="form-label">
                Category
              </label>
              <input
                id="task-category"
                type="text"
                className="input"
                placeholder="e.g. Venue, Catering, Photography"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-due" className="form-label form-label-required">
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                className="input"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-priority" className="form-label">
                Priority
              </label>
              <select
                id="task-priority"
                className="select"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-notes" className="form-label">
              Internal Notes & Reminders
            </label>
            <input
              id="task-notes"
              type="text"
              className="input"
              placeholder="e.g. Contact person: Ravi (+91 98765 43210)"
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="save-task-btn">
              {editingTaskId ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
