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
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 relative z-10 transition-colors',
                      isCompleted && 'bg-[#0052CC] text-white shadow-2xs',
                      isCurrent && 'bg-blue-50 text-[#0052CC] border-2 border-[#0052CC]',
                      !isCompleted &&
                        !isCurrent &&
                        'bg-slate-100 text-slate-400 border border-slate-200',
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-2',
                        isCompleted ? 'bg-[#0052CC]' : 'bg-slate-200',
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 hidden sm:block">
                  <p
                    className={cn(
                      'text-xs font-extrabold',
                      isCurrent && 'text-[#0052CC]',
                      isCompleted && 'text-slate-700',
                      !isCurrent && !isCompleted && 'text-slate-400',
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {step.description}
                  </p>
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
