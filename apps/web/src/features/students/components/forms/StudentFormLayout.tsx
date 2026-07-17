'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  description: string;
}

interface StudentFormLayoutProps {
  steps: FormStep[];
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export function StudentFormLayout({
  steps,
  currentStep,
  children,
  className,
}: StudentFormLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Step indicator */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 relative z-10 transition-colors',
                      isCompleted && 'bg-primary text-white',
                      isCurrent && 'bg-primary/10 text-primary border-2 border-primary',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn('h-0.5 flex-1 mx-2', isCompleted ? 'bg-primary' : 'bg-muted')}
                    />
                  )}
                </div>
                <div className="mt-2 hidden sm:block">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-muted-foreground',
                      !isCurrent && !isCompleted && 'text-muted-foreground/60',
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}
