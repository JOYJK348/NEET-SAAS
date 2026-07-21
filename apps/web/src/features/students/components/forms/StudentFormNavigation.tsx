'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface StudentFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext?: () => void;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  className?: string;
}

export function StudentFormNavigation({
  currentStep,
  totalSteps: _totalSteps,
  onPrevious,
  onNext,
  isSubmitting = false,
  isLastStep = false,
  className,
}: StudentFormNavigationProps) {
  const isFirstStep = currentStep === 0;

  const handleClick = () => {
    if (isLastStep) return;
    onNext?.();
  };

  return (
    <div
      className={cn('flex items-center justify-between pt-4 border-t border-[#E5E7EB]', className)}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="gap-1.5"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={isLastStep ? onNext : handleClick}
        className="gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : isLastStep ? (
          <>
            <Check className="h-4 w-4" />
            Save Student
          </>
        ) : (
          <>
            Next
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
