/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';

export function validateAdmissionStatusTransition(
  from: AdmissionStatusEnum,
  to: AdmissionStatusEnum,
): void {
  if (from === to) {
    throw new BadRequestException(`Admission is already in ${from} status`);
  }
  // ACTIVE ↔ INACTIVE only
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
