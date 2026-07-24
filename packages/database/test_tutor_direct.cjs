const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000003';

const dto = {
  firstName: 'Test',
  lastName: 'Tutor',
  email: `test_tutor_${Date.now()}@neetplatform.com`,
  phone: '+919876543210',
  employeeCode: `TUT_${Date.now().toString(36).toUpperCase()}`,
  designation: 'Senior Physics Faculty',
  qualification: 'M.Sc Physics',
  specialization: 'Mechanics',
  yearsOfExperience: 5,
  previousInstitution: 'Test Institute',
  bio: 'Test bio',
  createLogin: true,
  subjectIds: ['00000000-0000-0000-0000-000000000040'], // Physics
  branchIds: ['00000000-0000-0000-0000-000000000006'], // Sivakasi
  batchIds: ['00000000-0000-0000-0000-000000000030'], // NEET26_SIV_A
};

async function resolveDesignationInTx(tx, designationName, tenantId) {
  const designation = await tx.designations.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      OR: [{ name: designationName }, { code: designationName.toUpperCase().substring(0, 10) }],
    },
  });
  if (designation) return designation.id;

  const newId = randomUUID();
  const code = designationName.toUpperCase().substring(0, 10).replace(/\s+/g, '_');
  await tx.designations.create({
    data: {
      id: newId,
      tenantId,
      code,
      name: designationName,
      description: '',
      isActive: true,
      isSystem: false,
      createdBy: '00000000-0000-0000-0000-000000000000',
      updatedBy: '00000000-0000-0000-0000-000000000000',
    },
  });
  return newId;
}

async function run() {
  try {
    const employeeCode = dto.employeeCode || `TUT-${Date.now().toString(36).toUpperCase()}`;
    const placeholderHash = hashSync(randomUUID(), 8);

    const result = await prisma.$transaction(async (tx) => {
      const designationId = await resolveDesignationInTx(
        tx,
        dto.designation || 'Faculty',
        tenantId,
      );

      console.log('Creating user...');
      const user = await tx.users.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          userType: 'TUTOR',
          status: 'ACTIVE',
          tenantId,
          branchId: '',
          passwordHash: placeholderHash,
          forcePasswordChange: !dto.createLogin,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      console.log('Creating staff profile...');
      await tx.staffProfiles.create({
        data: {
          userId: user.id,
          tenantId,
          employeeCode,
          designationId,
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joinedAt: new Date(),
          resignedAt: new Date('2099-12-31'),
          officialEmail: dto.email,
          workPhone: dto.phone || '',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (
        dto.qualification ||
        dto.specialization ||
        dto.yearsOfExperience ||
        dto.previousInstitution
      ) {
        console.log('Creating staff qualifications...');
        await tx.staffQualifications.create({
          data: {
            staffProfileId: user.id,
            tenantId,
            degree: dto.qualification || '',
            institution: dto.previousInstitution || '',
            yearCompleted: new Date().getFullYear(),
            experienceMonths: (dto.yearsOfExperience || 0) * 12,
            certificatesMetadata: {},
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      if (dto.subjectIds && dto.subjectIds.length > 0) {
        console.log('Creating staff subjects...');
        for (const subjectId of dto.subjectIds) {
          await tx.staffSubjects.create({
            data: {
              staffProfileId: user.id,
              subjectId,
              tenantId,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }

      if (dto.branchIds && dto.branchIds.length > 0) {
        console.log('Creating staff departments...');
        for (const branchId of dto.branchIds) {
          await tx.staffDepartments.create({
            data: {
              staffProfileId: user.id,
              branchId,
              departmentId: '',
              tenantId,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }

      if (dto.batchIds && dto.batchIds.length > 0) {
        console.log('Creating staff batch assignments...');
        for (const batchId of dto.batchIds) {
          const batch = await tx.batches.findFirst({
            where: { id: batchId, tenantId },
            select: { courseId: true },
          });

          let assignedSubjectId = null;

          if (batch?.courseId) {
            const tutorCourseSubject = await tx.courseSubjects.findFirst({
              where: {
                tenantId,
                courseId: batch.courseId,
                subjectId: { in: dto.subjectIds || [] },
              },
              select: { subjectId: true },
            });
            if (tutorCourseSubject) {
              assignedSubjectId = tutorCourseSubject.subjectId;
            } else {
              const fallbackCourseSubject = await tx.courseSubjects.findFirst({
                where: { tenantId, courseId: batch.courseId },
                select: { subjectId: true },
              });
              if (fallbackCourseSubject) {
                assignedSubjectId = fallbackCourseSubject.subjectId;
              }
            }
          }

          if (!assignedSubjectId && dto.subjectIds && dto.subjectIds.length > 0) {
            assignedSubjectId = dto.subjectIds[0];
          }

          console.log(`Resolved assignedSubjectId: ${assignedSubjectId} for batch: ${batchId}`);
          if (assignedSubjectId) {
            await tx.staffBatchAssignments.create({
              data: {
                staffProfileId: user.id,
                batchId,
                subjectId: assignedSubjectId,
                tenantId,
                effectiveFrom: new Date(),
                effectiveTo: new Date('2099-12-31'),
                isActive: true,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }
        }
      }

      return user;
    });

    console.log('SUCCESS! Created user ID:', result.id);
  } catch (err) {
    console.error('TRANSACTION ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
