'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface AdmissionWizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
  className?: string;
}

export function AdmissionWizardLayout({
  steps,
  currentStep,
  children,
  className,
}: AdmissionWizardLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {index > 0 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5',
                    index <= currentStep ? 'bg-purple-600' : 'bg-gray-200',
                  )}
                />
              )}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors',
                    index < currentStep && 'bg-purple-600 text-white',
                    index === currentStep && 'bg-purple-600 text-white ring-4 ring-purple-100',
                    index > currentStep && 'bg-gray-100 text-gray-400',
                  )}
                >
                  {index < currentStep ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                </div>
                <p
                  className={cn(
                    'hidden sm:block text-xs mt-1.5 font-medium',
                    index <= currentStep ? 'text-purple-600' : 'text-gray-400',
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
