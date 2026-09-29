'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, FlaskConical, Dna, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SubjectScoreItem {
  subject: string;
  percentage: number;
  obtained?: number;
  total?: number;
  targetBenchmark?: number; // e.g. 80
}

interface SubjectBarChartProps {
  data: SubjectScoreItem[];
  className?: string;
}

const SUBJECT_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  physics: {
    icon: Zap,
    gradient: 'from-blue-600 to-indigo-600',
    bg: 'bg-blue-50/70',
    text: 'text-[#0052CC]',
    border: 'border-blue-200',
  },
  chemistry: {
    icon: FlaskConical,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50/70',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  botany: {
    icon: Dna,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50/70',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  zoology: {
    icon: BookOpen,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50/70',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  biology: {
    icon: Dna,
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50/70',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

function getSubjectConfig(subjectName: string) {
  const lower = subjectName.toLowerCase();
  for (const [key, conf] of Object.entries(SUBJECT_CONFIG)) {
    if (lower.includes(key)) return conf;
  }
  return {
    icon: BookOpen,
    gradient: 'from-purple-600 to-indigo-600',
    bg: 'bg-purple-50/70',
    text: 'text-purple-700',
    border: 'border-purple-200',
  };
}

function getPerformanceBadge(pct: number) {
  if (pct >= 85) {
    return {
      label: 'Mastered 🚀',
      cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }
  if (pct >= 70) {
    return {
      label: 'Good Progress ✨',
      cls: 'bg-blue-100 text-blue-800 border-blue-300',
    };
  }
  if (pct >= 55) {
    return {
      label: 'Needs Practice 📈',
      cls: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }
  return {
    label: 'Focus Needed ⚠️',
    cls: 'bg-rose-100 text-rose-800 border-rose-300',
  };
}

export function SubjectBarChart({ data, className }: SubjectBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
        No subject performance data available
      </div>
    );
  }

  return (
    <div className={cn('space-y-3.5 w-full', className)}>
      {data.map((item) => {
        const conf = getSubjectConfig(item.subject);
        const Icon = conf.icon;
        const badge = getPerformanceBadge(item.percentage);
        const benchmark = item.targetBenchmark ?? 75;

        return (
          <div
            key={item.subject}
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
          >
            {/* Header: Icon, Subject Title, Badge & Score */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
                    conf.bg,
                    conf.text,
                    conf.border,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs sm:text-sm text-[#0B2447] truncate">
                    {item.subject}
                  </h4>
                  {item.obtained !== undefined && item.total !== undefined && (
                    <p className="text-[10.5px] font-mono text-slate-500 font-bold">
                      {item.obtained} / {item.total} Marks
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0',
                    badge.cls,
                  )}
                >
                  {badge.label}
                </span>
                <span className="font-mono font-black text-sm sm:text-base text-[#0B2447] min-w-[42px] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar with Target Benchmark Marker */}
            <div className="space-y-1">
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                {/* Benchmark target line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 opacity-70"
                  style={{ left: `${benchmark}%` }}
                  title={`Target Benchmark: ${benchmark}%`}
                />

                {/* Animated Gradient Fill */}
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out shadow-2xs',
                    conf.gradient,
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5">
                <span>0%</span>
                <span className="text-slate-500 font-bold">Target: {benchmark}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
