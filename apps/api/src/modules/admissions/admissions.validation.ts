import { BadRequestException } from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';

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
