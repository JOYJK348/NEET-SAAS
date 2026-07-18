'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface AdmissionWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  className?: string;
}

export function AdmissionWizardNavigation({
  currentStep,
  onPrevious,
  onNext,
  isSubmitting = false,
  isLastStep = false,
  className,
}: AdmissionWizardNavigationProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-4 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-6',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          className="rounded-xl h-12 px-6"
          onClick={onPrevious}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          className="rounded-xl h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
          onClick={onNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Admission
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
