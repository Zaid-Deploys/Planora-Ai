import { EventType, EventSetting, TaskItem, TaskPriority } from '../../types/event';

/**
 * Returns integer day difference between two dates (dateStr - referenceDateStr).
 * Positive = future, 0 = today, negative = past.
 */
export function getDaysDifference(dateStr: string, referenceDateStr?: string): number {
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const target = new Date(dateStr);

  // Normalize to UTC midnight for consistent timezone-agnostic calendar day comparison
  const refUtc = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - refUtc) / msPerDay);
}

/**
 * Calculates days remaining from today (or reference date) until the event date.
 */
export function calculateDaysRemaining(eventDate: string, referenceDateStr?: string): number {
  return getDaysDifference(eventDate, referenceDateStr);
}

/**
 * Determines if a task is overdue.
 * A task is overdue if its due date is before today (or refDate) and it is not completed.
 */
export function isTaskOverdue(task: TaskItem, referenceDateStr?: string): boolean {
  if (task.status === 'completed') return false;
  const daysDiff = getDaysDifference(task.dueDate, referenceDateStr);
  return daysDiff < 0;
}

/**
 * Determines if a task is due urgently (within next 3 days) and not completed.
 */
export function isTaskUrgent(task: TaskItem, referenceDateStr?: string): boolean {
  if (task.status === 'completed') return false;
  const daysDiff = getDaysDifference(task.dueDate, referenceDateStr);
  return daysDiff >= 0 && daysDiff <= 3;
}

/**
 * Calculates offset date string (YYYY-MM-DD) from event date.
 * daysOffset is negative for days BEFORE event, positive for AFTER event.
 */
export function calculateOffsetDate(eventDate: string, daysOffset: number): string {
  const [year, month, day] = eventDate.split('-').map(Number);
  if (!year || !month || !day) return eventDate;

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysOffset);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface StarterTaskTemplate {
  title: string;
  description: string;
  category: string;
  idealDaysBefore: number;
  priority: TaskPriority;
}

const WEDDING_TEMPLATES: StarterTaskTemplate[] = [
  {
    title: 'Lock In Primary Venue',
    description: 'Finalize contract and deposit for ceremony and reception spaces.',
    category: 'Venue',
    idealDaysBefore: 120,
    priority: 'urgent',
  },
  {
    title: 'Secure Photographer & Videographer',
    description: 'Review portfolios, lock in hours of coverage, and sign agreement.',
    category: 'Photography',
    idealDaysBefore: 90,
    priority: 'high',
  },
  {
    title: 'Catering Menu Tasting & Selection',
    description: 'Finalize banquet menu, accommodate dietary restrictions, confirm bar package.',
    category: 'Catering',
    idealDaysBefore: 60,
    priority: 'high',
  },
  {
    title: 'Send Formal Invitations & Track RSVPs',
    description: 'Distribute physical or digital invites with clear response deadline.',
    category: 'Invitations',
    idealDaysBefore: 45,
    priority: 'high',
  },
  {
    title: 'Attire & Styling Fittings',
    description: 'Complete final tailoring and accessories check for key hosts.',
    category: 'Attire',
    idealDaysBefore: 30,
    priority: 'medium',
  },
  {
    title: 'Finalize Music Playlist & MC Schedule',
    description: 'Provide must-play and do-not-play lists to DJ/band, confirm announcements.',
    category: 'Entertainment',
    idealDaysBefore: 14,
    priority: 'medium',
  },
  {
    title: 'Final Seating Chart & Headcount to Venue',
    description: 'Provide final table assignments and dietary breakdown to caterer.',
    category: 'Logistics',
    idealDaysBefore: 7,
    priority: 'high',
  },
  {
    title: 'Vendor Day-Of Arrival & Contact Sheet',
    description: 'Confirm load-in times, contact numbers, and payment balances.',
    category: 'Vendors',
    idealDaysBefore: 3,
    priority: 'urgent',
  },
  {
    title: 'Post-Event Vendor Settlement & Thank-You Notes',
    description: 'Distribute remaining vendor gratuities and send appreciation messages.',
    category: 'Post-Event',
    idealDaysBefore: -2,
    priority: 'low',
  },
];

const BIRTHDAY_TEMPLATES: StarterTaskTemplate[] = [
  {
    title: 'Select Theme & Party Space',
    description: 'Decide on celebration style and reserve party area or home setup.',
    category: 'Venue',
    idealDaysBefore: 30,
    priority: 'high',
  },
  {
    title: 'Send Invitations & Collect RSVPs',
    description: 'Share digital invitations and confirm attendee count.',
    category: 'Invitations',
    idealDaysBefore: 21,
    priority: 'high',
  },
  {
    title: 'Order Custom Cake & Refreshments',
    description: 'Confirm cake design, flavors, snacks, and beverage options.',
    category: 'Catering',
    idealDaysBefore: 14,
    priority: 'high',
  },
  {
    title: 'Curate Party Playlist & Activity Supplies',
    description: 'Prepare music playlist, party games, and guest prizes.',
    category: 'Entertainment',
    idealDaysBefore: 7,
    priority: 'medium',
  },
  {
    title: 'Procure Balloons, Banners & Tableware',
    description: 'Pick up theme-matching decorations and disposable or reusable tableware.',
    category: 'Decor',
    idealDaysBefore: 3,
    priority: 'medium',
  },
  {
    title: 'Day-of Setup & Ice/Beverage Prep',
    description: 'Arrange tables, test audio, chill beverages, and welcome early arrivals.',
    category: 'Setup',
    idealDaysBefore: 0,
    priority: 'urgent',
  },
];

const COMMUNITY_TEMPLATES: StarterTaskTemplate[] = [
  {
    title: 'Confirm Facility Permit & Approvals',
    description: 'Secure required municipal, park, or facility permissions.',
    category: 'Permits',
    idealDaysBefore: 45,
    priority: 'urgent',
  },
  {
    title: 'Form Volunteer & Coordination Teams',
    description: 'Assign leads for welcome desk, safety, AV, and refreshments.',
    category: 'Volunteers',
    idealDaysBefore: 30,
    priority: 'high',
  },
  {
    title: 'Publish Community Announcement & Schedule',
    description: 'Distribute digital flyers, notices, and registration links.',
    category: 'Promotion',
    idealDaysBefore: 20,
    priority: 'high',
  },
  {
    title: 'Rent Audio/Visual Equipment & Seating',
    description: 'Confirm microphones, speakers, projector, and extra folding chairs.',
    category: 'Equipment',
    idealDaysBefore: 14,
    priority: 'medium',
  },
  {
    title: 'Safety, First Aid & Accessibility Check',
    description: 'Inspect step-free access, wheelchair seating, emergency exits, and first aid kit.',
    category: 'Accessibility',
    idealDaysBefore: 7,
    priority: 'high',
  },
  {
    title: 'Signage & Station Direction Walkthrough',
    description: 'Place directional signs, registration banners, and trash/recycling bins.',
    category: 'Logistics',
    idealDaysBefore: 1,
    priority: 'urgent',
  },
];

const DEFAULT_TEMPLATES: StarterTaskTemplate[] = [
  {
    title: 'Confirm Event Date & Location',
    description: 'Lock in date and secure access to the event space.',
    category: 'Venue',
    idealDaysBefore: 30,
    priority: 'urgent',
  },
  {
    title: 'Prepare Guest List & Send Invites',
    description: 'Gather contact details and distribute event invitations.',
    category: 'Invitations',
    idealDaysBefore: 20,
    priority: 'high',
  },
  {
    title: 'Arrange Refreshments & Food Options',
    description: 'Order food, beverages, and ensure dietary preferences are accommodated.',
    category: 'Catering',
    idealDaysBefore: 10,
    priority: 'high',
  },
  {
    title: 'Plan Event Atmosphere & Music',
    description: 'Assemble music playlists, lighting, and simple decorative elements.',
    category: 'Decor',
    idealDaysBefore: 5,
    priority: 'medium',
  },
  {
    title: 'Confirm Final Headcount & Day-Of Essentials',
    description: 'Double check supplies, timings, and arrival sequence.',
    category: 'Logistics',
    idealDaysBefore: 1,
    priority: 'urgent',
  },
];

/**
 * Deterministically generates a structured starter checklist based on event type,
 * remaining time window, and setting (e.g. outdoor contingency).
 * Clearly tagged as deterministic starter content (isAiGenerated: false).
 */
export function generateDeterministicStarterTasks(event: {
  type: EventType;
  date: string;
  setting?: EventSetting;
  guestCount?: number;
  accessibilityNeeds?: string;
}): TaskItem[] {
  let templates: StarterTaskTemplate[];

  switch (event.type) {
    case 'wedding':
      templates = [...WEDDING_TEMPLATES];
      break;
    case 'birthday':
      templates = [...BIRTHDAY_TEMPLATES];
      break;
    case 'community':
      templates = [...COMMUNITY_TEMPLATES];
      break;
    default:
      templates = [...DEFAULT_TEMPLATES];
      break;
  }

  // Outdoor setting contingency
  if (event.setting === 'outdoor' || event.setting === 'mixed') {
    templates.push({
      title: 'Weather Contingency & Shelter Plan',
      description: 'Check 72-hour forecast, secure pop-up canopies or indoor backup room, arrange fans/heaters.',
      category: 'Contingency',
      idealDaysBefore: 4,
      priority: 'high',
    });
  }

  // Accessibility considerations
  if (event.accessibilityNeeds && event.accessibilityNeeds.trim().length > 0) {
    templates.push({
      title: 'Verify Venue Accessibility & Seating Accommodations',
      description: `Confirm step-free pathways, reserved accessible seating, and accessible restrooms: ${event.accessibilityNeeds}`,
      category: 'Accessibility',
      idealDaysBefore: 10,
      priority: 'high',
    });
  }

  const daysAvailable = calculateDaysRemaining(event.date);

  return templates.map((template, index) => {
    // If the planning window is short, scale down the lead days so tasks aren't immediately overdue
    let targetDaysBefore = template.idealDaysBefore;
    if (daysAvailable > 0 && targetDaysBefore > daysAvailable) {
      // Compress proportionally into available days
      const ratio = targetDaysBefore / 120;
      targetDaysBefore = Math.max(1, Math.round(daysAvailable * Math.min(0.9, ratio)));
    } else if (daysAvailable <= 0) {
      targetDaysBefore = 0;
    }

    // Calculate due date string
    const dueDate = calculateOffsetDate(event.date, -targetDaysBefore);

    // If available time is tight (< 7 days), elevate priority
    let priority = template.priority;
    if (daysAvailable <= 7 && priority === 'medium') {
      priority = 'high';
    }

    return {
      id: `task-starter-${index + 1}`,
      title: template.title,
      description: template.description,
      category: template.category,
      dueDate,
      priority,
      status: 'not_started',
      isAiGenerated: false,
    };
  });
}
