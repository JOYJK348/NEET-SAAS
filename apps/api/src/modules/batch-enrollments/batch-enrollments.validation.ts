/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BatchStatusType } from '@prisma/client';
import { validateBatchEligibility } from '../admissions/admissions.validation';

export async function validateAdmissionForEnrollment(
  admissionId: string,
  tenantId: string,
  prisma: any,
): Promise<any> {
  const admission = await prisma.studentAdmissions.findFirst({
    where: { tenantId, id: admissionId, deletedAt: null },
  });

  if (!admission) {
    throw new NotFoundException('Admission not found');
  }

  validateBatchEligibility(admission.admissionStatus);

  return admission;
}

export async function validateBatchForEnrollment(
  batchId: string,
  tenantId: string,
  admission: any,
  prisma: any,
): Promise<any> {
  const batch = await prisma.batches.findFirst({
    where: { tenantId, id: batchId, deletedAt: null },
  });

  if (!batch) {
    throw new NotFoundException('Batch not found');
  }

  if (batch.status !== BatchStatusType.ACTIVE) {
    throw new BadRequestException(
      `Batch is not ACTIVE. Current status: ${batch.status}`,
    );
  }

  if (batch.academicYearId !== admission.academicYearId) {
    throw new BadRequestException(
      'Batch academic year does not match admission academic year',
    );
  }

  if (batch.courseId !== admission.courseId) {
    throw new BadRequestException(
      'Batch course does not match admission course',
    );
  }

  if (batch.branchId !== admission.branchId) {
    throw new BadRequestException(
      'Batch branch does not match admission branch',
    );
  }

  return batch;
}

export async function validateNoDuplicateEnrollment(
  admissionId: string,
  batchId: string,
  tenantId: string,
  prisma: any,
): Promise<void> {
  const existing = await prisma.studentBatchEnrollments.findFirst({
    where: {
      tenantId,
      studentAdmissionId: admissionId,
      batchId,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ConflictException('Student is already enrolled in this batch');
  }
}

export async function validateBatchCapacity(
  batchId: string,
  tenantId: string,
  prisma: any,
): Promise<void> {
  const batch = await prisma.batches.findFirst({
    where: { tenantId, id: batchId, deletedAt: null },
    select: { maxStudents: true },
  });

  if (!batch) {
    throw new NotFoundException('Batch not found');
  }

  const currentCount = await prisma.studentBatchEnrollments.count({
    where: {
      tenantId,
      batchId,
      status: BatchStatusType.ACTIVE,
      deletedAt: null,
    },
  });

  if (currentCount >= batch.maxStudents) {
    throw new ConflictException(
      `Batch has reached maximum capacity of ${batch.maxStudents} students`,
    );
  }
}
