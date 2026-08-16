import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning duplicate old installment plans...');

  const feeStructures = await prisma.feeStructures.findMany({ where: { deletedAt: null } });

  for (const fs of feeStructures) {
    const plans = await prisma.feeInstallmentPlans.findMany({
      where: { feeStructureId: fs.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (plans.length > 1) {
      const oldPlanIds = plans.slice(1).map((p) => p.id);
      console.log(`Soft deleting ${oldPlanIds.length} old duplicate installment plans for Fee Structure: ${fs.name} (${fs.code})`);

      await prisma.feeInstallmentPlans.updateMany({
        where: { id: { in: oldPlanIds } },
        data: { deletedAt: new Date(), isDefault: false },
      });
    }
  }

  console.log('Cleanup complete!');
  await prisma.$disconnect();
}

clean().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
