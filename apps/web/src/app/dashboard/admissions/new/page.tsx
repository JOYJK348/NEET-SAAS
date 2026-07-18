'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import { ReviewConfirmStep } from '@/features/admissions/components/forms/ReviewConfirmStep';
import { toast } from '@/hooks/use-toast';

const FORM_STEPS: WizardStep[] = [
  { id: 'student', title: 'Student', description: 'Select student' },
  { id: 'year', title: 'Year', description: 'Select academic year' },
  { id: 'course', title: 'Course', description: 'Select course' },
  { id: 'branch', title: 'Branch', description: 'Select branch' },
  { id: 'review', title: 'Review', description: 'Review & confirm' },
];

function AddAdmissionContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    studentProfileId: '',
    academicYearId: '',
    courseId: '',
    branchId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createAdmission, isCreating } = useCreateAdmission();
  const { students } = useStudentsForAdmission();
  const { courses } = useCoursesForAdmission();
  const { branches } = useBranchesForAdmission();
  const { years } = useAcademicYearsForAdmission();

  const updateFormField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
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
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const onSubmit = useCallback(async () => {
    const result = await createAdmission(formData);
    if (result) {
      toast({
        title: 'Admission Created',
        description: `Admission ${result.admissionNumber} has been created successfully.`,
      });
      router.push(`/dashboard/admissions/${result.id}`);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create admission.',
        variant: 'destructive',
      });
    }
  }, [createAdmission, formData, router]);

  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          <SelectStudentStep
            students={students}
            selectedStudentId={formData.studentProfileId}
            onSelect={(id) => updateFormField('studentProfileId', id)}
            error={errors.studentProfileId}
          />
        );
      case 1:
        return (
          <SelectAcademicYearStep
            years={years}
            selectedYearId={formData.academicYearId}
            onSelect={(id) => updateFormField('academicYearId', id)}
            error={errors.academicYearId}
          />
        );
      case 2:
        return (
          <SelectCourseStep
            courses={courses}
            selectedCourseId={formData.courseId}
            onSelect={(id) => updateFormField('courseId', id)}
            error={errors.courseId}
          />
        );
      case 3:
        return (
          <SelectBranchStep
            branches={branches}
            selectedBranchId={formData.branchId}
            onSelect={(id) => updateFormField('branchId', id)}
            error={errors.branchId}
          />
        );
      case 4:
        return (
          <ReviewConfirmStep
            student={students.find((s) => s.id === formData.studentProfileId)}
            course={courses.find((c) => c.id === formData.courseId)}
            branch={branches.find((b) => b.id === formData.branchId)}
            academicYearName={years.find((y) => y.id === formData.academicYearId)?.name}
            admissionDate={formData.admissionDate}
            notes={formData.notes}
          />
        );
      default:
        return null;
    }
  }, [currentStep, formData, students, courses, branches, years, errors, updateFormField]);

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
