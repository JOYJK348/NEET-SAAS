'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  useStudent,
  useUpdateStudent,
  useBatches,
  useCourses,
} from '@/features/students/hooks/use-students';
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
import { StudentEmptySection } from '@/features/students/components/StudentEmptySection';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic details and address' },
  { id: 'academic', title: 'Academic', description: 'Course and batch selection' },
  { id: 'parent', title: 'Parent', description: 'Parent/guardian details' },
  { id: 'medical', title: 'Medical', description: 'Health & identification' },
  { id: 'review', title: 'Review', description: 'Verify all information' },
];

function EditStudentContent() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || null;

  const { student, isLoading: studentLoading, error: studentError } = useStudent(id);
  const { updateStudent, isUpdating } = useUpdateStudent();
  const { batches } = useBatches();
  const { courses } = useCourses();

  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset,
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

  // Initialize form with student data
  useEffect(() => {
    if (student && !initialized) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        address: student.address,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        profileImage: student.profileImage,
        courseId: student.courseId,
        batchId: student.batchId,
        admissionDate: student.admissionDate,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        emergencyContact: student.emergencyContact || '',
        bloodGroup: student.bloodGroup || '',
        aadharNumber: student.aadharNumber || '',
      });
      setInitialized(true);
    }
  }, [student, initialized, reset]);

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
      if (!id) return;
      const result = await updateStudent({ id, ...data });
      if (result) {
        toast({ title: 'Student updated successfully' });
        router.push(`/dashboard/students/${id}`);
      } else {
        toast({ title: 'Failed to update student', variant: 'destructive' });
      }
    },
    [id, updateStudent, router],
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Student</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {student.firstName} {student.lastName} &mdash; {student.studentId}
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
              isSubmitting={isUpdating}
              isLastStep={currentStep === FORM_STEPS.length - 1}
            />
          </StudentFormLayout>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function EditStudentPage() {
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
      <EditStudentContent />
    </Suspense>
  );
}
