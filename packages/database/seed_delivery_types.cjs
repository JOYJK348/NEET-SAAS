const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

async function run() {
  const deliveryTypes = [
    {
      code: 'ONLINE',
      name: 'Online',
      description: 'Classes conducted online via video streaming',
      attendanceMode: 'ONLINE',
      colorCode: '#3b82f6',
      iconName: 'Laptop',
    },
    {
      code: 'OFFLINE',
      name: 'Offline',
      description: 'Physical face-to-face classes on campus',
      attendanceMode: 'CLASSROOM',
      colorCode: '#ef4444',
      iconName: 'Building',
    },
    {
      code: 'HYBRID',
      name: 'Hybrid',
      description: 'Combination of online and offline learning sessions',
      attendanceMode: 'HYBRID',
      colorCode: '#10b981',
      iconName: 'GitBranch',
    },
  ];

  const now = new Date();
  const startTime = new Date();
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(17, 0, 0, 0);

  for (const dt of deliveryTypes) {
    const existing = await prisma.batchDeliveryTypes.findFirst({
      where: {
        tenantId: DEMO_TENANT_ID,
        code: dt.code,
        deletedAt: null,
      },
    });

    if (!existing) {
      await prisma.batchDeliveryTypes.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          code: dt.code,
          name: dt.name,
          description: dt.description,
          attendanceMode: dt.attendanceMode,
          colorCode: dt.colorCode,
          iconName: dt.iconName,
          defaultStartTime: startTime,
          defaultEndTime: endTime,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
          isDefault: true,
          isActive: true,
        },
      });
      console.log(`Created delivery type: ${dt.name}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
