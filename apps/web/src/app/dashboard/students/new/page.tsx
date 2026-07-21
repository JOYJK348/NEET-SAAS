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
import { MedicalInformationStep } from '@/features/students/components/forms/MedicalInformationStep';
import { ReviewStep } from '@/features/students/components/forms/ReviewStep';
import { toast } from '@/hooks/use-toast';

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic details and address' },
  { id: 'academic', title: 'Academic', description: 'Course and batch selection' },
  { id: 'parent', title: 'Parent', description: 'Parent/guardian details' },
  { id: 'medical', title: 'Medical', description: 'Health & identification' },
  { id: 'review', title: 'Review', description: 'Verify all information' },
];

function AddStudentContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { createStudent, isCreating } = useCreateStudent();
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
    resolver: zodResolver(studentFormSchema),
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
      case 3:
        fieldsToValidate = ['bloodGroup', 'aadharNumber'];
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

  const onSubmit = useCallback(
    async (data: StudentFormData) => {
      if (currentStep !== FORM_STEPS.length - 1) return;
      try {
        const student = await createStudent(data);
        if (student) {
          toast({ title: 'Student created successfully' });
          router.push(`/dashboard/students/${student.id}`);
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
            const academicFields = ['courseId', 'batchId', 'admissionDate'];
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
    [createStudent, router, setError, setCurrentStep, currentStep],
  );

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
          <MedicalInformationStep
            register={register}
            errors={errors}
            values={values}
            onFieldChange={handleFieldChange}
            setValue={setValue}
          />
        );
      case 4:
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Student</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Create a new student record
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <StudentFormLayout steps={FORM_STEPS} currentStep={currentStep}>
              {renderStep()}

              <StudentFormNavigation
                currentStep={currentStep}
                totalSteps={FORM_STEPS.length}
                onPrevious={handlePrevious}
                onNext={
                  currentStep === FORM_STEPS.length - 1
                    ? () => {
                        handleSubmit(onSubmit, (errs) => {
                          const errorFields = Object.keys(errs)
                            .map((key) => {
                              const err = errs[key as keyof typeof errs];
                              return `${key}: ${err?.message || 'invalid input'}`;
                            })
                            .join('. ');
                          toast({
                            title: 'Form Validation Failed',
                            description: errorFields || 'Please verify all inputs.',
                            variant: 'destructive',
                          });
                        })();
                      }
                    : handleNext
                }
                isSubmitting={isCreating}
                isLastStep={currentStep === FORM_STEPS.length - 1}
              />
            </StudentFormLayout>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AddStudentPage() {
  return (
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
  );
}
