import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tutorId = 'e042b209-510f-4f35-b273-26878e87f396';
  
  const user = await prisma.users.findUnique({
    where: { id: tutorId },
    include: {
      staff_profiless: {
        include: {
          staff_subjectss: true,
          staff_departmentss: true,
          staff_qualificationss: true,
          staff_batch_assignmentss: true,
        },
      },
    },
  });

  console.log('USER RECORD:', JSON.stringify(user, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
