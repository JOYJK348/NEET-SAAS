import type { BatchStatus } from '@/features/batches/types/batch';

import { formatDateOnly, formatDateTime as centralFormatDateTime } from '@/lib/date-utils';

export function formatBatchDate(dateString: string): string {
  return formatDateOnly(dateString, 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return centralFormatDateTime(dateString, 'MMM d, yyyy h:mm a');
}

export function calculateUtilizationRate(enrolled: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.round((enrolled / capacity) * 100);
}

export function getUtilizationColor(rate: number): string {
  if (rate >= 90) return 'text-red-600';
  if (rate >= 75) return 'text-amber-600';
  if (rate >= 50) return 'text-blue-600';
  return 'text-green-600';
}

export function isBatchTerminal(status: BatchStatus): boolean {
  return status === 'ARCHIVED';
}

export function canEditBatch(status: BatchStatus): boolean {
  return !isBatchTerminal(status);
}

export function escapeCSVValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(rows: string[][], headers: string[]): string {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSVValue).join(','));
  return [headerLine, ...dataLines].join('\n');
}
