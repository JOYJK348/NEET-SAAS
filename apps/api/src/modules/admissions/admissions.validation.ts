/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';

const TERMINAL_STATUSES: AdmissionStatusEnum[] = [
  AdmissionStatusEnum.COMPLETED,
  AdmissionStatusEnum.CANCELLED,
];

const ALLOWED_TRANSITIONS: Record<AdmissionStatusEnum, AdmissionStatusEnum[]> =
  {
    [AdmissionStatusEnum.PENDING]: [
      AdmissionStatusEnum.CONFIRMED,
      AdmissionStatusEnum.CANCELLED,
    ],
    [AdmissionStatusEnum.CONFIRMED]: [
      AdmissionStatusEnum.ACTIVE,
      AdmissionStatusEnum.CANCELLED,
    ],
    [AdmissionStatusEnum.ACTIVE]: [AdmissionStatusEnum.COMPLETED],
    [AdmissionStatusEnum.COMPLETED]: [],
    [AdmissionStatusEnum.CANCELLED]: [],
  };

export function validateAdmissionStatusTransition(
  from: AdmissionStatusEnum,
  to: AdmissionStatusEnum,
): void {
  if (from === to) {
    throw new BadRequestException(`Admission is already in ${from} status`);
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid admission status transition from ${from} to ${to}`,
    );
  }
}

export function validateTerminalState(status: AdmissionStatusEnum): void {
  if (TERMINAL_STATUSES.includes(status)) {
    throw new BadRequestException(
      `Admission is already in terminal state ${status}. No further status updates are allowed.`,
    );
  }
}

export function validateActiveAdmission(
  studentId: string,
  tenantId: string,
  academicYearId: string,
  opts?: { excludeAdmissionId?: string; prisma: any },
): Promise<void> {
  return validateActiveAdmissionImpl(studentId, tenantId, academicYearId, opts);
}

async function validateActiveAdmissionImpl(
  studentId: string,
  tenantId: string,
  academicYearId: string,
  opts?: { excludeAdmissionId?: string; prisma: any },
): Promise<void> {
  const where: Record<string, unknown> = {
    tenantId,
    studentProfileId: studentId,
    academicYearId,
    admissionStatus: AdmissionStatusEnum.ACTIVE,
    deletedAt: null,
  };

  if (opts?.excludeAdmissionId) {
    where.id = { not: opts.excludeAdmissionId };
  }

  const existing = await opts!.prisma.studentAdmissions.findFirst({
    where,
  });

  if (existing) {
    throw new ConflictException(
      'Only one ACTIVE admission is allowed per student per academic year',
    );
  }
}

export function validateBatchEligibility(
  admissionStatus: AdmissionStatusEnum,
): void {
  if (admissionStatus !== AdmissionStatusEnum.ACTIVE) {
    throw new BadRequestException(
      `Batch enrollment is only allowed for ACTIVE admissions. Current status: ${admissionStatus}`,
    );
  }
}
