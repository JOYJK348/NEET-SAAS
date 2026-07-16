import { PrismaService } from '../../../common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdmissionNumberGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, academicYearId: string): Promise<string> {
    const academicYear = await this.prisma.academicYears.findUnique({
      where: { id: academicYearId },
      select: { startDate: true },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const year = academicYear.startDate.getFullYear().toString();

    const lastAdmission = await this.prisma.studentAdmissions.findFirst({
      where: {
        tenantId,
        admissionNumber: { startsWith: `${year}-` },
      },
      orderBy: { admissionNumber: 'desc' },
      select: { admissionNumber: true },
    });

    let nextSeq = 1;
    if (lastAdmission) {
      const parts = lastAdmission.admissionNumber.split('-');
      if (parts.length >= 2) {
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq)) {
          nextSeq = seq + 1;
        }
      }
    }

    return `${year}-${String(nextSeq).padStart(6, '0')}`;
  }
}
