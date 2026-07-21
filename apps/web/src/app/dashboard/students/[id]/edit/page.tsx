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
import { ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useStudent,
  useUpdateStudent,
  useBatches,
  useCourses,
} from '@/features/students/hooks/use-students';
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
    resolver: zodResolver(studentFormSchema),
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
  }, [register]);

  // Initialize form with student data
  useEffect(() => {
    if (student && !initialized) {
      const backendStatus =
        student.status === 'INACTIVE' || student.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
      setStudentStatus(backendStatus);
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
        branchId: student.branchId || '',
        academicYearId: student.academicYearId || '',
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
      if (!id || currentStep !== FORM_STEPS.length - 1) return;
      try {
        const result = await updateStudent({ id, ...data, status: studentStatus });
        if (result) {
          toast({ title: 'Student updated successfully' });
          router.push(`/dashboard/students/${id}`);
        }
      } catch (err: any) {
        const responseData = err.response?.data;
        if (responseData?.code === 'VALIDATION_ERROR' && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((e: { field: string; message: string }) => {
            setError(e.field as keyof StudentFormData, { type: 'server', message: e.message });
          });
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
          }
          toast({ title: 'Conflict', description: msg, variant: 'destructive' });
        } else {
          toast({
            title: 'Error Updating Student',
            description: responseData?.message || err.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
      }
    },
    [id, updateStudent, router, studentStatus, setError, currentStep],
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
            status={studentStatus}
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Student</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {student.firstName} {student.lastName} &mdash; {student.studentId}
            </p>
          </div>
        </div>

        {/* Status Toggle Card */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Student Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {studentStatus === 'ACTIVE'
                    ? 'Active students can access courses and batches'
                    : 'Inactive students are hidden from course/batch listings'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setStudentStatus(studentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                }
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  studentStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                    studentStatus === 'ACTIVE' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {studentStatus === 'ACTIVE' ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                  )}
                </span>
              </button>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                  studentStatus === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {studentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

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
