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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const values = watch();

  // Register custom select fields
  useEffect(() => {
    register('gender');
    register('courseId');
    register('batchId');
  }, [register]);

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
        fieldsToValidate = ['parentName', 'parentPhone', 'parentEmail'];
        break;
      case 3:
        fieldsToValidate = [];
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
      const student = await createStudent(data);
      if (student) {
        toast({ title: 'Student created successfully' });
        router.push(`/dashboard/students/${student.id}`);
      } else {
        toast({ title: 'Failed to create student', variant: 'destructive' });
      }
    },
    [createStudent, router],
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
            batches={batches}
            courses={courses}
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
          />
        );
      case 4:
        return <ReviewStep values={values} batches={batches} courses={courses} />;
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

        <form onSubmit={handleSubmit(onSubmit)}>
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
