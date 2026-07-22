import { prisma, DEMO_TENANT_ID, SYSTEM_USER_ID } from './helpers';

export async function seedDeliveryTypes(): Promise<void> {
  const deliveryTypes = [
    {
      code: 'ONLINE',
      name: 'Online',
      description: 'Classes conducted online via video streaming',
      attendanceMode: 'ONLINE' as const,
      colorCode: '#3b82f6',
      iconName: 'Laptop'
    },
    {
      code: 'OFFLINE',
      name: 'Offline',
      description: 'Physical face-to-face classes on campus',
      attendanceMode: 'CLASSROOM' as const,
      colorCode: '#ef4444',
      iconName: 'Building'
    },
    {
      code: 'HYBRID',
      name: 'Hybrid',
      description: 'Combination of online and offline learning sessions',
      attendanceMode: 'HYBRID' as const,
      colorCode: '#10b981',
      iconName: 'GitBranch'
    }
  ];

  const startTime = new Date();
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(17, 0, 0, 0);

  for (const dt of deliveryTypes) {
    const existing = await prisma.batchDeliveryTypes.findFirst({
      where: { tenantId: DEMO_TENANT_ID, code: dt.code },
    });

    if (existing) {
      await prisma.batchDeliveryTypes.update({
        where: { id: existing.id },
        data: {
          name: dt.name,
          description: dt.description,
          attendanceMode: dt.attendanceMode,
          colorCode: dt.colorCode,
          iconName: dt.iconName,
          defaultStartTime: startTime,
          defaultEndTime: endTime,
          updatedBy: SYSTEM_USER_ID,
        },
      });
    } else {
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
          isDefault: true,
          isActive: true,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
        },
      });
    }
  }
}
