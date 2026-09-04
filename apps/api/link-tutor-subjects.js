const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staffProfiles.findFirst({
    where: { userId: '26a0238e-92cb-4780-b7f3-15450a4bfa32' },
  });

  const physics = await prisma.subjects.findFirst({
    where: { name: { equals: 'Physics', mode: 'insensitive' } },
  });

  if (!staff || !physics) {
    console.log('Staff or Physics subject not found');
    return;
  }

  const existing = await prisma.staffSubjects.findFirst({
    where: { staffProfileId: staff.userId, subjectId: physics.id },
  });

  if (!existing) {
    await prisma.staffSubjects.create({
      data: {
        tenantId: staff.tenantId,
        staffProfileId: staff.userId,
        subjectId: physics.id,
        createdBy: staff.userId,
        updatedBy: staff.userId,
      },
    });
    console.log(
      `Linked tutor ${staff.userId} to Physics subject (${physics.id})`,
    );
  } else {
    console.log('Link already exists for tutor and Physics subject');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
