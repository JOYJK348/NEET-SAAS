import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log('Assigning fee structures to all students...');

  const admissions = await prisma.studentAdmissions.findMany({
    where: { deletedAt: null },
  });

  const defaultFeeStructure = await prisma.feeStructures.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!defaultFeeStructure) {
    console.log('No fee structure found in database to assign!');
    await prisma.$disconnect();
    return;
  }

  console.log(`Using Fee Structure: ${defaultFeeStructure.name} (${defaultFeeStructure.id})`);

  const installmentPlan = await prisma.feeInstallmentPlans.findFirst({
    where: { feeStructureId: defaultFeeStructure.id, deletedAt: null },
  });

  const planItems = installmentPlan
    ? await prisma.feeInstallmentPlanItems.findMany({
        where: { installmentPlanId: installmentPlan.id, deletedAt: null },
      })
    : [];

  const items = await prisma.feeStructureItems.findMany({
    where: { feeStructureId: defaultFeeStructure.id, deletedAt: null },
  });

  const baseAmount = items.reduce((acc, item) => acc + Number(item.amount), 0);
  const finalAmount = baseAmount > 0 ? baseAmount : 12000;

  for (const adm of admissions) {
    const existingAssignment = await prisma.studentFeeAssignments.findFirst({
      where: { studentAdmissionId: adm.id, deletedAt: null },
    });

    if (!existingAssignment) {
      console.log(`Creating fee assignment for admission ID: ${adm.id}`);

      const assignment = await prisma.studentFeeAssignments.create({
        data: {
          tenantId: adm.tenantId,
          studentAdmissionId: adm.id,
          feeStructureId: defaultFeeStructure.id,
          installmentPlanId: installmentPlan ? installmentPlan.id : null,
          baseAmount: finalAmount,
          taxAmount: 0,
          discountAmount: 0,
          adjustmentAmount: 0,
          finalAmount,
          outstandingAmount: finalAmount,
          assignedBy: adm.createdBy,
          remarks: 'Auto-assigned initial fee structure',
          createdBy: adm.createdBy,
          updatedBy: adm.createdBy,
        },
      });

      if (planItems.length > 0) {
        let allocated = 0;

        for (let idx = 0; idx < planItems.length; idx++) {
          const item = planItems[idx];
          let instAmount = Number(item.amountFixed || 0);
          if (instAmount <= 0) {
            instAmount = Math.floor(finalAmount / planItems.length);
          }

          if (idx === planItems.length - 1) {
            instAmount = finalAmount - allocated;
          } else {
            allocated += instAmount;
          }

          await prisma.studentFeeInstallments.create({
            data: {
              tenantId: adm.tenantId,
              studentFeeAssignmentId: assignment.id,
              feeInstallmentId: item.id,
              installmentNumber: item.installmentNumber,
              dueDate: item.dueDate,
              baseAmount: instAmount,
              taxAmount: 0,
              discountAmount: 0,
              penaltyAmount: 0,
              finalAmount: instAmount,
              paidAmount: 0,
              balanceAmount: instAmount,
              status: 'UNPAID',
              createdBy: adm.createdBy,
              updatedBy: adm.createdBy,
            },
          });
        }
      } else {
        await prisma.studentFeeInstallments.create({
          data: {
            tenantId: adm.tenantId,
            studentFeeAssignmentId: assignment.id,
            feeInstallmentId: assignment.id,
            installmentNumber: 1,
            dueDate: new Date(),
            baseAmount: finalAmount,
            taxAmount: 0,
            discountAmount: 0,
            penaltyAmount: 0,
            finalAmount,
            paidAmount: 0,
            balanceAmount: finalAmount,
            status: 'UNPAID',
            createdBy: adm.createdBy,
            updatedBy: adm.createdBy,
          },
        });
      }
    }
  }

  console.log('All student fee assignments updated successfully!');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
