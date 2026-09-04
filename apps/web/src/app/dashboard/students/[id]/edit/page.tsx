'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ToggleLeft, ToggleRight, User } from 'lucide-react';
import {
  useStudent,
  useUpdateStudent,
  useBatches,
  useCourses,
} from '@/features/students/hooks/use-students';
import {
  useAdmissions,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import {
  StudentFormData,
  studentFormSchema,
  defaultFormValues,
} from '@/features/students/validation/student-schema';
import { StudentFormLayout } from '@/features/students/components/forms/StudentFormLayout';
import { StudentFormNavigation } from '@/features/students/components/forms/StudentFormNavigation';
import { PersonalInformationStep } from '@/features/students/components/forms/PersonalInformationStep';
import { AcademicInformationStep } from '@/features/students/components/forms/AcademicInformationStep';
import { ParentInformationStep } from '@/features/students/components/forms/ParentInformationStep';
import { ReviewStep } from '@/features/students/components/forms/ReviewStep';
import { StudentEmptySection } from '@/features/students/components/StudentEmptySection';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic details and address' },
  { id: 'academic', title: 'Academic', description: 'Course and batch selection' },
  { id: 'parent', title: 'Parent', description: 'Parent/guardian details' },
  { id: 'review', title: 'Review', description: 'Verify all information' },
];

function EditStudentContent() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || null;

  const { student, isLoading: studentLoading, error: studentError } = useStudent(id);
  const { admissions = [] } = useAdmissions({
    initialFilters: { studentProfileId: id || undefined, perPage: 10 },
    autoFetch: !!id,
  });
  const { updateStudent, isUpdating } = useUpdateStudent();
  const { batches } = useBatches();
  const { courses } = useCourses();
  const { branches } = useBranchesForAdmission();
  const { years: academicYears } = useAcademicYearsForAdmission();
  const { data: branchCourses = [] } = useBranchCourses();

  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [studentStatus, setStudentStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset,
    setError,
    clearErrors,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema) as any,
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const values = watch();

  // Register custom select fields
  useEffect(() => {
    register('gender');
    register('branchId');
    register('academicYearId');
    register('courseId');
    register('batchId');
    register('classType');
  }, [register]);

  // Initialize form with student data & admission/batch fallback IDs
  useEffect(() => {
    if (student) {
      const backendStatus =
        student.status === 'INACTIVE' || student.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
      setStudentStatus(backendStatus);

      // Resolve admission / enrollment values as fallbacks
      const latestAdmission = (student as any)?.admissions?.[0] || admissions?.[0];
      const targetBatchId = student.batchId || latestAdmission?.batchId || '';
      const matchedBatch = batches.find((b) => b.id === targetBatchId);

      const resolvedBatchId =
        targetBatchId || matchedBatch?.id || (batches.length > 0 ? batches[0].id : '');
      const resolvedCourseId =
        student.courseId ||
        latestAdmission?.courseId ||
        matchedBatch?.courseId ||
        (courses.length > 0 ? courses[0].id : '');
      const resolvedBranchId =
        student.branchId ||
        latestAdmission?.branchId ||
        matchedBatch?.branchId ||
        (branches.length > 0 ? branches[0].id : '');
      const resolvedAcademicYearId =
        student.academicYearId ||
        latestAdmission?.academicYearId ||
        matchedBatch?.academicYearId ||
        (academicYears.length > 0 ? academicYears[0].id : '');

      // Safe date formatter for HTML date inputs (YYYY-MM-DD)
      const formatDateForInput = (dVal?: any) => {
        if (!dVal) return '';
        try {
          const dt = new Date(dVal);
          if (isNaN(dt.getTime())) return '';
          return dt.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      if (!initialized) {
        reset({
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.phone || '',
          dateOfBirth: formatDateForInput(student.dateOfBirth),
          gender: student.gender || 'MALE',
          address: student.address || '',
          city: student.city || '',
          state: student.state || '',
          pincode: student.pincode || '',
          profileImage: student.profileImage || '',
          courseId: resolvedCourseId,
          batchId: resolvedBatchId,
          branchId: resolvedBranchId,
          academicYearId: resolvedAcademicYearId,
          admissionDate: formatDateForInput(
            student.admissionDate || latestAdmission?.admissionDate,
          ),
          parentName: student.parentName || '',
          parentPhone: student.parentPhone || '',
          parentEmail: student.parentEmail || '',
          emergencyContact: student.emergencyContact || '',
          bloodGroup: student.bloodGroup || '',
          aadharNumber: student.aadharNumber || '',
          classType: (student as any)?.classType || 'CLASSROOM',
        });
        if (resolvedAcademicYearId && resolvedBranchId) {
          setInitialized(true);
        }
      }
    }
  }, [student, admissions, batches, branches, academicYears, courses, initialized, reset]);

  const handleFieldChange = useCallback(
    (field: keyof StudentFormData, value: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(field as any, value, { shouldValidate: true });
    },
    [setValue],
  );

  const handleNext = useCallback(async () => {
    let fieldsToValidate: (keyof StudentFormData)[] = [];
    switch (currentStep) {
      case 0:
        fieldsToValidate = [
          'firstName',
          'lastName',
          'email',
          'phone',
          'dateOfBirth',
          'gender',
          'address',
          'city',
          'state',
          'pincode',
        ];
        break;
      case 1:
        fieldsToValidate = ['courseId', 'batchId', 'admissionDate'];
        break;
      case 2:
        fieldsToValidate = ['parentName', 'parentPhone', 'parentEmail', 'emergencyContact'];
        break;
    }

    if (fieldsToValidate.length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
      return;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    }
  }, [currentStep, trigger]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const onInvalidSubmit = useCallback(
    (errs: any) => {
      console.warn('[STUDENT EDIT] Client validation failed:', errs);
      const errorKeys = Object.keys(errs);
      if (errorKeys.length === 0) return;

      const personalFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'gender',
        'address',
        'city',
        'state',
        'pincode',
      ];
      const academicFields = [
        'branchId',
        'academicYearId',
        'courseId',
        'batchId',
        'admissionDate',
        'classType',
      ];
      const parentFields = ['parentName', 'parentPhone', 'parentEmail', 'emergencyContact'];

      let firstErrorStep = -1;
      for (const fieldName of errorKeys) {
        if (personalFields.includes(fieldName) && firstErrorStep === -1) {
          firstErrorStep = 0;
        } else if (
          academicFields.includes(fieldName) &&
          (firstErrorStep === -1 || firstErrorStep > 1)
        ) {
          firstErrorStep = 1;
        } else if (
          parentFields.includes(fieldName) &&
          (firstErrorStep === -1 || firstErrorStep > 2)
        ) {
          firstErrorStep = 2;
        }
      }

      if (firstErrorStep !== -1) {
        setCurrentStep(firstErrorStep);
      }

      const errorMessages = errorKeys
        .map((key) => {
          const err = errs[key];
          return err?.message ? `${key}: ${err.message}` : key;
        })
        .join('. ');

      toast({
        title: 'Form Validation Failed',
        description: errorMessages || 'Please check the highlighted fields.',
        variant: 'destructive',
      });
    },
    [setCurrentStep],
  );

  const onSubmit = useCallback(
    async (data: StudentFormData) => {
      if (!id) return;
      console.log(
        '[STUDENT EDIT] Save button clicked - Starting API update submission for studentId:',
        id,
      );

      setIsSavingLocal(true);
      try {
        const result = await updateStudent({ id, ...data, status: studentStatus });
        console.log('[STUDENT EDIT] API Response received successfully:', result);

        if (result) {
          toast({ title: 'Student details updated successfully' });
          router.push(`/dashboard/students/${id}`);
        }
      } catch (err: any) {
        console.error('[STUDENT EDIT] API Error caught:', err);
        const responseData = err.response?.data;
        if (responseData?.code === 'VALIDATION_ERROR' && Array.isArray(responseData.errors)) {
          let firstErrorStep = -1;
          responseData.errors.forEach((e: { field: string; message: string }) => {
            const fieldName = e.field as keyof StudentFormData;
            setError(fieldName, { type: 'server', message: e.message });

            let stepIndex = -1;
            const personalFields = [
              'firstName',
              'lastName',
              'email',
              'phone',
              'dateOfBirth',
              'gender',
              'address',
              'city',
              'state',
              'pincode',
            ];
            const academicFields = ['courseId', 'batchId', 'admissionDate', 'classType'];
            const parentFields = ['parentName', 'parentPhone', 'parentEmail'];

            if (personalFields.includes(e.field)) stepIndex = 0;
            else if (academicFields.includes(e.field)) stepIndex = 1;
            else if (parentFields.includes(e.field)) stepIndex = 2;

            if (stepIndex !== -1 && (firstErrorStep === -1 || stepIndex < firstErrorStep)) {
              firstErrorStep = stepIndex;
            }
          });

          if (firstErrorStep !== -1) {
            setCurrentStep(firstErrorStep);
          }
          toast({
            title: 'Validation Failed',
            description: 'Please check the input fields for errors.',
            variant: 'destructive',
          });
        } else if (err.response?.status === 409) {
          const msg = responseData?.message || '';
          if (msg.toLowerCase().includes('email')) {
            setError('email', {
              type: 'server',
              message: 'A student with this email already exists',
            });
            setCurrentStep(0);
          }
          toast({ title: 'Conflict', description: msg, variant: 'destructive' });
        } else {
          toast({
            title: 'Error Updating Student',
            description: responseData?.message || err.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsSavingLocal(false);
        console.log('[STUDENT EDIT] Submission finalized - isSavingLocal reset to false');
      }
    },
    [id, updateStudent, router, studentStatus, setError, setCurrentStep],
  );

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#FAFAFA]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (studentError || !student) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
          <StudentEmptySection
            title="Student not found"
            description={studentError?.message || 'The student you are looking for does not exist.'}
            variant="warning"
            icon={<AlertCircle className="h-6 w-6" />}
            actionLabel="Back to Students"
            onAction={() => router.push('/dashboard/students')}
          />
        </div>
      </DashboardLayout>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInformationStep
            register={register}
            errors={errors}
            values={values}
            onFieldChange={handleFieldChange}
          />
        );
      case 1:
        return (
          <AcademicInformationStep
            register={register}
            errors={errors}
            values={values}
            onFieldChange={handleFieldChange}
            branches={branches}
            academicYears={academicYears}
            batches={batches}
            courses={courses}
            branchCourses={branchCourses}
          />
        );
      case 2:
        return (
          <ParentInformationStep
            register={register}
            errors={errors}
            values={values}
            onFieldChange={handleFieldChange}
          />
        );
      case 3:
        return (
          <ReviewStep
            values={values}
            branches={branches}
            academicYears={academicYears}
            batches={batches}
            courses={courses}
            status={studentStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Top Back Action Bar */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push(`/dashboard/students/${id}`)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span className="hidden sm:inline">Back to Student Profile</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        {/* Dedicated ISML LMS Style Light Blue Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
                  {student.studentId || 'STD-REG'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {studentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-snug truncate">
                Edit Student Details &mdash; {student.firstName} {student.lastName}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Update student personal info, course track, batch allocation, and parent contacts.
              </p>
            </div>
          </div>

          {/* Status Toggle in Header */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-200 shrink-0 shadow-2xs self-end sm:self-auto">
            <span className="text-xs font-bold text-[#0B2447]">Status:</span>
            <button
              type="button"
              onClick={() => setStudentStatus(studentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                studentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  studentStatus === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-extrabold text-[#0B2447]">
              {studentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div>
          <StudentFormLayout steps={FORM_STEPS} currentStep={currentStep}>
            {renderStep()}

            <StudentFormNavigation
              currentStep={currentStep}
              totalSteps={FORM_STEPS.length}
              onPrevious={handlePrevious}
              onNext={
                currentStep === FORM_STEPS.length - 1
                  ? () => handleSubmit(onSubmit, onInvalidSubmit)()
                  : handleNext
              }
              isSubmitting={isUpdating || isSavingLocal}
              isLastStep={currentStep === FORM_STEPS.length - 1}
            />
          </StudentFormLayout>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function EditStudentPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <Suspense
        fallback={
          <DashboardLayout>
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
              <LoadingSpinner size="lg" />
            </div>
          </DashboardLayout>
        }
      >
        <EditStudentContent />
      </Suspense>
    </ProtectedRoute>
  );
}
