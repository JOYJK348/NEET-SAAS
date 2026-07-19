export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

import { formatDateOnly, formatDateTime as centralFormatDateTime } from '@/lib/date-utils';

export function formatDate(dateString: string): string {
  return formatDateOnly(dateString, 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return centralFormatDateTime(dateString, 'MMM d, yyyy h:mm a');
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('+91-')) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91-${cleaned}`;
  }
  return phone;
}

export function getStatusBadgeVariant(
  status: string,
): 'success' | 'warning' | 'info' | 'destructive' | 'default' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'INACTIVE':
      return 'default';
    case 'SUSPENDED':
    case 'DROPPED_OUT':
      return 'destructive';
    case 'GRADUATED':
      return 'info';
    default:
      return 'default';
  }
}
