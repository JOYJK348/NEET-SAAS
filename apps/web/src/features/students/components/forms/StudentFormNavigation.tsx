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
    // Always explicitly call onNext — never rely on native form submit (type="submit")
    // because React re-render timing can cause accidental submissions when button type changes
    if (isSubmitting) return;
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
        className="gap-1.5 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs"
      >
        <ChevronLeft className="h-4 w-4 text-[#0052CC]" />
        Previous
      </Button>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={handleClick}
        className="gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs px-5"
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
