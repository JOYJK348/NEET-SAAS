'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  useCreateAdmission,
  useStudentsForAdmission,
  useCoursesForAdmission,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import {
  AdmissionWizardLayout,
  type WizardStep,
} from '@/features/admissions/components/forms/AdmissionWizardLayout';
import { AdmissionWizardNavigation } from '@/features/admissions/components/forms/AdmissionWizardNavigation';
import { SelectStudentStep } from '@/features/admissions/components/forms/SelectStudentStep';
import { SelectAcademicYearStep } from '@/features/admissions/components/forms/SelectAcademicYearStep';
import { SelectCourseStep } from '@/features/admissions/components/forms/SelectCourseStep';
import { SelectBranchStep } from '@/features/admissions/components/forms/SelectBranchStep';
import { SelectBatchStep } from '@/features/admissions/components/forms/SelectBatchStep';
import { ReviewConfirmStep } from '@/features/admissions/components/forms/ReviewConfirmStep';
import { useBatchesForAdmission } from '@/features/admissions/hooks/use-admissions';
import { toast } from '@/hooks/use-toast';

const FORM_STEPS: WizardStep[] = [
  { id: 'student', title: 'Student', description: 'Select student' },
  { id: 'year', title: 'Year', description: 'Select academic year' },
  { id: 'course', title: 'Course', description: 'Select course' },
  { id: 'batch', title: 'Batch', description: 'Select batch' },
  { id: 'branch', title: 'Branch', description: 'Select branch' },
  { id: 'review', title: 'Review', description: 'Review & confirm' },
];

function AddAdmissionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get('studentId') || '';

  const [currentStep, setCurrentStep] = useState(urlStudentId ? 1 : 0);
  const [formData, setFormData] = useState({
    studentProfileId: urlStudentId,
    academicYearId: '',
    courseId: '',
    batchId: '',
    branchId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldErrorMap, setFieldErrorMap] = useState<Record<string, string>>({});

  const stepFieldMap: Record<string, number> = {
    studentProfileId: 0,
    academicYearId: 1,
    courseId: 2,
    batchId: 3,
    branchId: 4,
  };

  const stepRequiredFields: Record<number, string[]> = {
    0: ['studentProfileId'],
    1: ['academicYearId'],
    2: ['courseId'],
    3: ['batchId'],
    4: ['branchId'],
  };

  const { createAdmission, isCreating } = useCreateAdmission();
  const { students } = useStudentsForAdmission();
  const { courses } = useCoursesForAdmission();
  const { batches } = useBatchesForAdmission(formData.courseId);
  const { branches } = useBranchesForAdmission();
  const { years } = useAcademicYearsForAdmission();

  const updateFormField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFieldErrorMap((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {};
      switch (step) {
        case 0:
          if (!formData.studentProfileId) newErrors.studentProfileId = 'Please select a student';
          break;
        case 1:
          if (!formData.academicYearId) newErrors.academicYearId = 'Please select an academic year';
          break;
        case 2:
          if (!formData.courseId) newErrors.courseId = 'Please select a course';
          break;
        case 3:
          if (!formData.batchId) newErrors.batchId = 'Please select a batch';
          break;
        case 4:
          if (!formData.branchId) newErrors.branchId = 'Please select a branch';
          break;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, urlStudentId ? 1 : 0));
  }, [urlStudentId]);

  const onSubmit = useCallback(async () => {
    try {
      const result = await createAdmission(formData);
      if (result) {
        toast({
          title: 'Admission Created',
          description: `Admission ${result.admissionNumber} has been created successfully.`,
        });
        router.push(`/dashboard/admissions/${result.id}`);
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      const newFieldErrors: Record<string, string> = {};
      let firstErrorStep = -1;

      // Check for structured validation errors { code: 'VALIDATION_ERROR', errors: [{ field, message }] }
      if (responseData?.code === 'VALIDATION_ERROR' && Array.isArray(responseData.errors)) {
        responseData.errors.forEach((e: { field: string; message: string }) => {
          const stepIndex = stepFieldMap[e.field];
          if (stepIndex !== undefined) {
            newFieldErrors[e.field] = e.message;
            if (firstErrorStep === -1 || stepIndex < firstErrorStep) {
              firstErrorStep = stepIndex;
            }
          }
        });

        // Check if student inactive error came as a general message
        if (responseData.message && firstErrorStep === -1) {
          const msg = (responseData.message || '').toLowerCase();
          if (msg.includes('active') || msg.includes('inactive')) {
            newFieldErrors.studentProfileId = responseData.message;
            firstErrorStep = 0;
          }
        }
      } else if (responseData?.statusCode === 400 && Array.isArray(responseData.message)) {
        // Plain class-validator errors format
        responseData.message.forEach((msg: string) => {
          const field = msg.split(' ')[0];
          const stepIndex = stepFieldMap[field];
          if (stepIndex !== undefined) {
            newFieldErrors[field] = msg;
            if (firstErrorStep === -1 || stepIndex < firstErrorStep) {
              firstErrorStep = stepIndex;
            }
          }
        });
      } else if (responseData?.message) {
        // Generic business error - try to map by content
        const msg = (responseData.message || '').toLowerCase();
        if (msg.includes('student')) {
          newFieldErrors.studentProfileId = responseData.message;
          firstErrorStep = 0;
        } else if (msg.includes('course')) {
          newFieldErrors.courseId = responseData.message;
          firstErrorStep = 2;
        } else if (msg.includes('year')) {
          newFieldErrors.academicYearId = responseData.message;
          firstErrorStep = 1;
        } else if (msg.includes('branch')) {
          newFieldErrors.branchId = responseData.message;
          firstErrorStep = 3;
        }
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrorMap(newFieldErrors);
        if (firstErrorStep !== -1) {
          setCurrentStep(firstErrorStep);
        }
      }

      toast({
        title: 'Validation Failed',
        description:
          Object.values(newFieldErrors).join('. ') ||
          'Please check the input fields and try again.',
        variant: 'destructive',
      });
    }
  }, [createAdmission, formData, router, stepFieldMap]);

  const renderStep = useCallback(() => {
    const allErrors = { ...fieldErrorMap, ...errors };
    switch (currentStep) {
      case 0:
        return (
          <SelectStudentStep
            students={students}
            selectedStudentId={formData.studentProfileId}
            onSelect={(id) => updateFormField('studentProfileId', id)}
            error={allErrors.studentProfileId}
          />
        );
      case 1:
        return (
          <SelectAcademicYearStep
            years={years}
            selectedYearId={formData.academicYearId}
            onSelect={(id) => updateFormField('academicYearId', id)}
            error={allErrors.academicYearId}
          />
        );
      case 2:
        return (
          <SelectCourseStep
            courses={courses}
            selectedCourseId={formData.courseId}
            onSelect={(id) => {
              updateFormField('courseId', id);
              updateFormField('batchId', ''); // Reset batch when course changes
            }}
            error={allErrors.courseId}
          />
        );
      case 3:
        return (
          <SelectBatchStep
            batches={batches}
            selectedBatchId={formData.batchId}
            onSelect={(id) => updateFormField('batchId', id)}
            error={allErrors.batchId}
          />
        );
      case 4:
        return (
          <SelectBranchStep
            branches={branches}
            selectedBranchId={formData.branchId}
            onSelect={(id) => updateFormField('branchId', id)}
            error={allErrors.branchId}
          />
        );
      case 5:
        return (
          <ReviewConfirmStep
            student={students.find((s) => s.id === formData.studentProfileId)}
            course={courses.find((c) => c.id === formData.courseId)}
            batch={batches.find((b) => b.id === formData.batchId)}
            branch={branches.find((b) => b.id === formData.branchId)}
            academicYearName={years.find((y) => y.id === formData.academicYearId)?.name}
            admissionDate={formData.admissionDate}
            notes={formData.notes}
          />
        );
      default:
        return null;
    }
  }, [
    currentStep,
    formData,
    students,
    courses,
    batches,
    branches,
    years,
    errors,
    fieldErrorMap,
    updateFormField,
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => router.push('/dashboard/admissions')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Admission</h1>
          <p className="text-sm text-gray-500">Create a new student admission</p>
        </div>
      </div>

      <AdmissionWizardLayout steps={FORM_STEPS} currentStep={currentStep}>
        {renderStep()}

        <AdmissionWizardNavigation
          currentStep={currentStep}
          totalSteps={FORM_STEPS.length}
          onPrevious={handlePrevious}
          onNext={currentStep === FORM_STEPS.length - 1 ? onSubmit : handleNext}
          isSubmitting={isCreating}
          isLastStep={currentStep === FORM_STEPS.length - 1}
        />
      </AdmissionWizardLayout>
    </div>
  );
}

export default function AddAdmissionPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <AddAdmissionContent />
      </Suspense>
    </DashboardLayout>
  );
}
