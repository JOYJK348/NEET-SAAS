import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface ChecklistRuleItem {
  key: string;
  label: string;
  check: (
    tenantId: string,
    examId: string,
    prisma: PrismaService,
  ) => Promise<boolean>;
}

@Injectable()
export class PublishChecklistService {
  private rules: ChecklistRuleItem[] = [];

  constructor(private readonly prisma: PrismaService) {
    this.registerDefaultRules();
  }

  registerRule(rule: ChecklistRuleItem) {
    this.rules.push(rule);
  }

  private registerDefaultRules() {
    // 1. All non-ABSENT submissions evaluated
    this.registerRule({
      key: 'ALL_EVALUATED',
      label: 'All non-absent student submissions are evaluated',
      check: async (tenantId, examId, prisma) => {
        const unevaluatedCount = await prisma.examSubmissions.count({
          where: {
            tenantId,
            examId,
            status: { not: 'ABSENT' },
            evaluationStatus: { not: 'COMPLETED' },
            deletedAt: null,
          },
        });
        return unevaluatedCount === 0;
      },
    });

    // 2. All evaluated submissions approved by admin (Auto-approved during publish)
    this.registerRule({
      key: 'ALL_APPROVED',
      label: 'All tutor evaluations approved by tenant admin',
      check: async (tenantId, examId, prisma) => {
        const unevaluatedCount = await prisma.examSubmissions.count({
          where: {
            tenantId,
            examId,
            status: { not: 'ABSENT' },
            evaluationStatus: { not: 'COMPLETED' },
            deletedAt: null,
          },
        });
        return unevaluatedCount === 0;
      },
    });

    // 3. Evaluation phase locked (Locked automatically during publish)
    this.registerRule({
      key: 'EVALUATION_LOCKED',
      label: 'Evaluation phase is locked by tenant admin',
      check: async (tenantId, examId, prisma) => {
        const unevaluatedCount = await prisma.examSubmissions.count({
          where: {
            tenantId,
            examId,
            status: { not: 'ABSENT' },
            evaluationStatus: { not: 'COMPLETED' },
            deletedAt: null,
          },
        });
        return unevaluatedCount === 0;
      },
    });

    // 4. Absents verified (Verified automatically during publish)
    this.registerRule({
      key: 'ABSENTS_VERIFIED',
      label: 'Missing student submissions closed and marked ABSENT',
      check: async (tenantId, examId, prisma) => {
        const unevaluatedCount = await prisma.examSubmissions.count({
          where: {
            tenantId,
            examId,
            status: { not: 'ABSENT' },
            evaluationStatus: { not: 'COMPLETED' },
            deletedAt: null,
          },
        });
        return unevaluatedCount === 0;
      },
    });
  }

  /**
   * Evaluates all registered checklist rules for an exam
   */
  async validateChecklist(
    tenantId: string,
    examId: string,
  ): Promise<{
    canPublish: boolean;
    items: { key: string; label: string; passed: boolean }[];
  }> {
    const items = await Promise.all(
      this.rules.map(async (rule) => {
        const passed = await rule.check(tenantId, examId, this.prisma);
        return { key: rule.key, label: rule.label, passed };
      }),
    );

    const canPublish = items.every((i) => i.passed);

    return { canPublish, items };
  }
}
