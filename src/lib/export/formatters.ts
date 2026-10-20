import { EventPlan } from '../../types/event';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function triggerDownload(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete single event plan as formatted JSON.
 */
export function exportEventToJson(event: EventPlan): void {
  const jsonStr = JSON.stringify(event, null, 2);
  const cleanName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  triggerDownload(jsonStr, `planora-${cleanName}.json`, 'application/json');
}

/**
 * Exports all saved events as backup JSON.
 */
export function exportAllEventsToJson(events: EventPlan[]): void {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    generator: 'Planora AI',
    schemaVersion: 1,
    events,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  triggerDownload(jsonStr, `planora-all-events-backup.json`, 'application/json');
}

/**
 * Exports budget allocation and expenses as CSV.
 */
export function exportBudgetToCsv(event: EventPlan): void {
  const headers = ['Type', 'Category', 'Title/Name', 'Percentage', 'Allocated Amount', 'Estimated Cost', 'Actual Cost', 'Paid', 'Notes'];
  const rows: string[][] = [];

  // Allocations
  event.categoryAllocations.forEach((alloc) => {
    rows.push([
      'Allocation',
      alloc.name,
      alloc.categoryKey,
      `${alloc.percentage}%`,
      String(alloc.allocatedAmount),
      '-',
      '-',
      '-',
      '',
    ]);
  });

  // Expenses
  event.expenses.forEach((item) => {
    rows.push([
      'Expense',
      item.categoryKey,
      item.title,
      '-',
      '-',
      String(item.estimatedCost),
      String(item.actualCost),
      item.paid ? 'Yes' : 'No',
      item.notes || '',
    ]);
  });

  const csvContent = [
    `# Event: ${event.name}`,
    `# Total Budget: ${event.currency} ${event.totalBudget}`,
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\r\n');

  const cleanName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  triggerDownload(csvContent, `planora-budget-${cleanName}.csv`, 'text/csv');
}

/**
 * Exports task checklist as CSV.
 */
export function exportTasksToCsv(event: EventPlan): void {
  const headers = ['Task Title', 'Category', 'Due Date', 'Priority', 'Status', 'Description', 'Notes', 'AI Generated'];
  const rows = event.tasks.map((task) => [
    task.title,
    task.category,
    task.dueDate,
    task.priority,
    task.status,
    task.description || '',
    task.notes || '',
    task.isAiGenerated ? 'Yes' : 'No',
  ]);

  const csvContent = [
    `# Event: ${event.name}`,
    `# Date: ${event.date}`,
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\r\n');

  const cleanName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  triggerDownload(csvContent, `planora-checklist-${cleanName}.csv`, 'text/csv');
}

/**
 * Exports vendor organizer ledger as CSV.
 */
export function exportVendorsToCsv(event: EventPlan): void {
  const headers = ['Vendor Name', 'Category', 'Contact Name', 'Phone', 'Email', 'Website', 'Quoted Price', 'Status', 'Notes'];
  const rows = event.vendors.map((vendor) => [
    vendor.name,
    vendor.category,
    vendor.contactName || '',
    vendor.phone || '',
    vendor.email || '',
    vendor.website || '',
    vendor.quotedPrice ? String(vendor.quotedPrice) : '-',
    vendor.status,
    vendor.notes || '',
  ]);

  const csvContent = [
    `# Event: ${event.name}`,
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\r\n');

  const cleanName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  triggerDownload(csvContent, `planora-vendors-${cleanName}.csv`, 'text/csv');
}
