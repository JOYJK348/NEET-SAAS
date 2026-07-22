import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  const academicYears = await prisma.academicYears.findMany({ where: { tenantId } });
  console.log('AcademicYears:', JSON.stringify(academicYears.map(a=>({id:a.id, name:a.name, code:a.code})), null, 2));

  const branches = await prisma.branches.findMany({ where: { tenantId } });
  console.log('Branches:', JSON.stringify(branches.map(b=>({id:b.id, name:b.name, code:b.code})), null, 2));

  const courses = await prisma.courses.findMany({ where: { tenantId } });
  console.log('Courses:', JSON.stringify(courses.map(c=>({id:c.id, name:c.name, code:c.code})), null, 2));

  const subjects = await prisma.subjects.findMany({ where: { tenantId } });
  console.log('Subjects:', JSON.stringify(subjects.map(s=>({id:s.id, name:s.name, code:s.code})), null, 2));

  console.log('DONE');
  await prisma['$disconnect']();
}
main();
