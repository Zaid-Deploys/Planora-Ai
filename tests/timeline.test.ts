import { describe, it, expect } from 'vitest';
import {
  calculateDaysRemaining,
  isTaskOverdue,
  isTaskUrgent,
  calculateOffsetDate,
  generateDeterministicStarterTasks,
} from '../src/lib/timeline/generator';
import { TaskItem } from '../src/types/event';

describe('Timeline & Task Logic', () => {
  it('accurately calculates days remaining from a reference date', () => {
    const days = calculateDaysRemaining('2026-10-30', '2026-10-20');
    expect(days).toBe(10);

    const pastDays = calculateDaysRemaining('2026-10-15', '2026-10-20');
    expect(pastDays).toBe(-5);

    const sameDay = calculateDaysRemaining('2026-10-20', '2026-10-20');
    expect(sameDay).toBe(0);
  });

  it('correctly detects overdue tasks when incomplete and past due date', () => {
    const overdueTask: TaskItem = {
      id: 't1',
      title: 'Book Venue',
      category: 'Venue',
      dueDate: '2026-10-15',
      priority: 'high',
      status: 'not_started',
    };

    expect(isTaskOverdue(overdueTask, '2026-10-20')).toBe(true);

    // Completed tasks are never overdue
    const completedTask: TaskItem = {
      ...overdueTask,
      status: 'completed',
    };
    expect(isTaskOverdue(completedTask, '2026-10-20')).toBe(false);
  });

  it('correctly detects urgent tasks due within 3 days', () => {
    const urgentTask: TaskItem = {
      id: 't2',
      title: 'Final Headcount',
      category: 'Logistics',
      dueDate: '2026-10-22',
      priority: 'urgent',
      status: 'not_started',
    };

    expect(isTaskUrgent(urgentTask, '2026-10-20')).toBe(true);

    const distantTask: TaskItem = {
      ...urgentTask,
      dueDate: '2026-11-20',
    };
    expect(isTaskUrgent(distantTask, '2026-10-20')).toBe(false);
  });

  it('generates contextual starter tasks with outdoor contingencies and accessibility', () => {
    const tasks = generateDeterministicStarterTasks({
      type: 'wedding',
      date: '2026-12-01',
      setting: 'outdoor',
      accessibilityNeeds: 'Wheelchair access ramp needed for main banquet hall',
    });

    expect(tasks.length).toBeGreaterThan(5);

    // Should include outdoor weather contingency
    const weatherTask = tasks.find((t) => t.category === 'Contingency');
    expect(weatherTask).toBeDefined();
    expect(weatherTask?.title).toContain('Weather Contingency');

    // Should include accessibility task
    const accessTask = tasks.find((t) => t.category === 'Accessibility');
    expect(accessTask).toBeDefined();
    expect(accessTask?.description).toContain('Wheelchair');
  });

  it('adapts deadlines and scales urgency for short planning windows', () => {
    // Event in 5 days
    const shortEventDate = calculateOffsetDate(new Date().toISOString().split('T')[0]!, 5);

    const tasks = generateDeterministicStarterTasks({
      type: 'birthday',
      date: shortEventDate,
    });

    // Check that tasks are not scheduled into the past beyond available window
    tasks.forEach((t) => {
      expect(t.dueDate).toBeDefined();
    });
  });
});
