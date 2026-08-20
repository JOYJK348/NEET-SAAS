'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StudentLoginCredentialsDialog } from '@/features/students/components/StudentLoginCredentialsDialog';
import { useCreateStudent, useBatches, useCourses } from '@/features/students/hooks/use-students';
import {
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
import { toast } from '@/hooks/use-toast';

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic details and address' },
  { id: 'academic', title: 'Academic', description: 'Course and batch selection' },
  { id: 'parent', title: 'Parent', description: 'Parent/guardian details' },
  { id: 'review', title: 'Review', description: 'Verify all information' },
];

function AddStudentContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { createStudent, isCreating } = useCreateStudent();
  const [credentials, setCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    parentPortalInfo?: any;
  } | null>(null);
  const { batches } = useBatches();
  const { courses } = useCourses();
  const { branches } = useBranchesForAdmission();
  const { years: academicYears } = useAcademicYearsForAdmission();

  const { data: branchCourses = [] } = useBranchCourses();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    setError,
    clearErrors,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema) as any,
    defaultValues: defaultFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
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

  const handleFieldChange = useCallback(
    (field: keyof StudentFormData, value: string) => {
      clearErrors(field as any);
      setValue(field as any, value, { shouldDirty: true });
    },
    [setValue, clearErrors],
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
        fieldsToValidate = ['branchId', 'academicYearId', 'courseId', 'batchId', 'admissionDate'];
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

  const onInvalidSubmit = useCallback(
    (errs: any) => {
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
      try {
        const student = (await createStudent(data)) as any;
        if (student) {
          toast({ title: 'Student created successfully' });
          if (student.generatedPassword || student.parentPortalInfo) {
            setCredentials({
              name: `${student.firstName} ${student.lastName}`,
              email: student.email,
              password: student.generatedPassword,
              parentPortalInfo: student.parentPortalInfo,
            });
          } else {
            router.push(`/dashboard/students/${student.id}`);
          }
        } else {
          toast({
            title: 'Failed to create student',
            description: 'Please check your inputs and try again.',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        const responseData = err.response?.data;
        if (
          responseData &&
          responseData.code === 'VALIDATION_ERROR' &&
          Array.isArray(responseData.errors)
        ) {
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
            description: 'Please check the input fields for validation errors.',
            variant: 'destructive',
          });
        } else if (err.response?.status === 409) {
          const msg = responseData?.message || 'A student record conflict occurred';
          if (msg.toLowerCase().includes('email')) {
            setError('email', {
              type: 'server',
              message: 'A student with this email already exists',
            });
            setCurrentStep(0);
          }
          toast({ title: 'Duplicate Student Record', description: msg, variant: 'destructive' });
        } else {
          toast({
            title: 'Error Creating Student',
            description: responseData?.message || err.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
      }
    },
    [createStudent, router, setError, setCurrentStep],
  );

  const handleCredentialsClose = useCallback(() => {
    setCredentials(null);
    router.push('/dashboard/students');
  }, [router]);

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
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push('/dashboard/students')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to Student Directory</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        {/* Dedicated Screen Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <span className="text-xl sm:text-2xl font-black">🎓</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Student Registration & Admission Setup 🎓
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Register new candidate profiles, assign default course track, and configure parent
                  credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
            <StudentFormLayout steps={FORM_STEPS} currentStep={currentStep}>
              {renderStep()}

              <StudentFormNavigation
                currentStep={currentStep}
                totalSteps={FORM_STEPS.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                isSubmitting={isCreating}
                isLastStep={currentStep === FORM_STEPS.length - 1}
              />
            </StudentFormLayout>
          </form>
        </div>
      </div>

      {credentials && (
        <StudentLoginCredentialsDialog
          open={true}
          onOpenChange={handleCredentialsClose}
          studentName={credentials.name}
          studentEmail={credentials.email}
          studentPassword={credentials.password}
          parentPortalInfo={credentials.parentPortalInfo}
        />
      )}
    </DashboardLayout>
  );
}

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function AddStudentPage() {
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
        <AddStudentContent />
      </Suspense>
    </ProtectedRoute>
  );
}
