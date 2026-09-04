const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batches.findMany({
    select: { id: true, name: true, tenantId: true },
  });
  const subjects = await prisma.subjects.findMany({
    select: { id: true, name: true },
  });
  const staff = await prisma.staffProfiles.findFirst();

  console.log('Found Batches:', batches);
  console.log(
    'Found Subjects:',
    subjects.map((s) => s.name),
  );
  console.log('Staff Profile:', staff?.userId);

  if (!batches.length || !subjects.length || !staff) {
    console.log('Missing basic setup data');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekdays = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const todayDayStr = weekdays[today.getDay()];

  // Update existing schedules to include today's day of week or create schedule entries for today
  await prisma.schedules.updateMany({
    data: {
      dayOfWeek: todayDayStr,
      effectiveFrom: new Date('2026-01-01'),
    },
  });
  console.log(`Updated schedules dayOfWeek to ${todayDayStr}`);

  // Create LiveClasses for TODAY for each batch & subject
  for (const b of batches) {
    for (const sub of subjects.slice(0, 2)) {
      const start = new Date(today);
      start.setHours(14, 0, 0, 0); // 2:00 PM
      const end = new Date(today);
      end.setHours(16, 0, 0, 0); // 4:00 PM

      const liveExists = await prisma.liveClasses.findFirst({
        where: {
          batchId: b.id,
          subjectId: sub.id,
          scheduledStart: { gte: today },
        },
      });

      if (!liveExists) {
        await prisma.liveClasses.create({
          data: {
            tenantId: b.tenantId,
            courseId: '56371baf-c626-4515-aa3d-26d164d297e1',
            subjectId: sub.id,
            chapterId: '8e89c2d1-1be5-4305-9bf7-6b66daa2c9c1',
            topicId: 'd66601b4-a882-49b8-b8d7-59bb510dbb9b',
            batchId: b.id,
            title: `${sub.name} Live Interactive Session`,
            subtitle: 'NEET Coaching Live Studio',
            description: 'Live interactive session for NEET aspirants.',
            status: 'SCHEDULED',
            scheduledStart: start,
            scheduledEnd: end,
            recordingEnabled: true,
            whiteboardEnabled: true,
            chatEnabled: true,
            screenShareEnabled: true,
            createdBy: staff.userId,
            updatedBy: staff.userId,
          },
        });
        console.log(
          `Created live class for batch ${b.name} - subject ${sub.name}`,
        );
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
