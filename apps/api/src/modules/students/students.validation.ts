import { BadRequestException } from '@nestjs/common';

const MIN_AGE = 15;
const MAX_AGE = 25;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ENQUIRY: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'WITHDRAWN', 'ALUMNI'],
  SUSPENDED: ['ACTIVE', 'WITHDRAWN'],
  WITHDRAWN: ['ALUMNI'],
  ALUMNI: [],
};

export function validateAge(dateOfBirth: Date): void {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  if (age < MIN_AGE || age > MAX_AGE) {
    throw new BadRequestException(
      `Student age must be between ${MIN_AGE} and ${MAX_AGE} years`,
    );
  }
}

export function validateAcademicStatusTransition(
  from: string,
  to: string,
): void {
  if (from === to) return;

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) {
    throw new BadRequestException(`Unknown academic status: ${from}`);
  }

  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid academic status transition from ${from} to ${to}`,
    );
  }
}

export function getAllowedTransitions(): Record<string, string[]> {
  return ALLOWED_TRANSITIONS;
}
