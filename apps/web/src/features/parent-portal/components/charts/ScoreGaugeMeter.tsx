'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Award, Target, Sparkles } from 'lucide-react';

interface ScoreGaugeMeterProps {
  score: number;      // e.g. 590
  maxScore?: number;  // e.g. 720
  targetScore?: number;// e.g. 620
  rank?: number;
  label?: string;
  className?: string;
}

export function ScoreGaugeMeter({
  score,
  maxScore = 720,
  targetScore = 600,
  rank,
  label = 'Projected NEET Score',
  className,
}: ScoreGaugeMeterProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));

  // Semi-circle parameters
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const arcLength = Math.PI * radius; // Half circumference
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  // Rating label
  const getRating = (pct: number) => {
    if (pct >= 85) return { text: 'Outstanding (Top 5%) 🌟', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 75) return { text: 'Government MBBS Zone 🏆', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 60) return { text: 'Competitive Score 📈', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    return { text: 'Needs Improvement ⚠️', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const rating = getRating(percentage);

  return (
    <div className={cn('p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center select-none', className)}>
      <div className="flex items-center justify-between w-full pb-2 border-b border-slate-100 text-xs">
        <span className="font-extrabold text-[#0B2447] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Target className="w-3.5 h-3.5 text-[#0052CC]" /> {label}
        </span>
        {rank !== undefined && rank > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0052CC] font-black text-[10.5px]">
            Rank #{rank}
          </span>
        )}
      </div>

      {/* Radial Semi-circle Gauge */}
      <div className="relative flex items-center justify-center my-3" style={{ width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="60%" stopColor="#0052CC" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-3xl sm:text-4xl text-[#0B2447] tracking-tight">
              {score}
            </span>
            <span className="font-mono font-bold text-slate-400 text-xs sm:text-sm">
              /{maxScore}
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-[#0052CC] font-mono mt-0.5">
            {percentage}% Accuracy
          </span>
        </div>
      </div>

      {/* Target Marker & Rating Tag */}
      <div className="w-full space-y-2 pt-2 border-t border-slate-100 text-center">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-2">
          <span>Min: 0</span>
          <span className="text-emerald-700 font-extrabold">Govt MBBS Target: {targetScore}+</span>
          <span>Max: {maxScore}</span>
        </div>

        <div className={cn('px-3 py-1.5 rounded-xl border text-xs font-black shadow-2xs inline-block w-full', rating.color)}>
          {rating.text}
        </div>
      </div>
    </div>
  );
}
