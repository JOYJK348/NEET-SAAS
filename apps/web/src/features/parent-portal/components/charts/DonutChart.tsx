'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  className?: string;
}

export function DonutChart({
  data,
  size = 200,
  strokeWidth = 24,
  centerTitle,
  centerSubtitle,
  className,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeSegment = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* SVG Donut Ring */}
      <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 transition-all duration-300"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
            />
          ) : (
            data.map((item, idx) => {
              const itemPercent = (item.value / total) * 100;
              const strokeDashoffset = circumference - (circumference * itemPercent) / 100;
              const strokeDasharray = `${circumference} ${circumference}`;
              const rotation = (accumulatedPercent / 100) * 360;
              accumulatedPercent += itemPercent;

              const isHovered = activeIndex === idx;

              return (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '50% 50%',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onTouchStart={() => setActiveIndex(idx)}
                />
              );
            })
          )}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeSegment ? (
            <>
              <span className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
                {Math.round((activeSegment.value / (total || 1)) * 100)}%
              </span>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate max-w-[120px]">
                {activeSegment.label}
              </span>
              {activeSegment.subtext && (
                <span className="text-[10px] text-slate-400 font-medium">{activeSegment.subtext}</span>
              )}
            </>
          ) : (
            <>
              <span className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
                {centerTitle ?? `${total}`}
              </span>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                {centerSubtitle ?? 'Total'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 w-full pt-1">
        {data.map((item, idx) => {
          const isHovered = activeIndex === idx;
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(idx === activeIndex ? null : idx)}
              className={cn(
                'flex items-center justify-between p-2 rounded-xl border text-left transition-all text-xs cursor-pointer',
                isHovered
                  ? 'border-blue-300 bg-blue-50/60 shadow-xs scale-102'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-800 text-[11px] truncate">{item.label}</span>
              </div>
              <span className="font-mono font-extrabold text-slate-900 text-xs shrink-0 pl-1">
                {percent}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
