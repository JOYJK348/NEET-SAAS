'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Trophy } from 'lucide-react';

export interface TrendDataPoint {
  label: string;      // e.g. "Test 1"
  score: number;      // e.g. 82
  totalScore?: number;// e.g. 100
  marks?: number;     // e.g. 590
  maxMarks?: number;  // e.g. 720
  date?: string;      // e.g. "2026-09-15"
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  height?: number;
  className?: string;
  showAverageLine?: boolean;
  isChronological?: boolean;
}

export function TrendLineChart({
  data,
  height = 200,
  className,
  showAverageLine = true,
  isChronological = false,
}: TrendLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
        No exam history available yet
      </div>
    );
  }

  // Ensure chronological order (oldest to newest)
  const chartData = isChronological ? data : [...data].reverse();

  const width = 600;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;

  const maxVal = 100;
  const minVal = 0;

  // Calculate coordinates
  const points = chartData.map((d, index) => {
    const x =
      chartData.length === 1
        ? width / 2
        : paddingX + (index / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.score / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // Calculate Average
  const averageScore = Math.round(
    chartData.reduce((acc, c) => acc + c.score, 0) / chartData.length,
  );
  const avgY = paddingTop + chartHeight - (averageScore / maxVal) * chartHeight;

  // Highest Score Point
  const highestScore = Math.max(...chartData.map((d) => d.score));

  // Build smooth Bezier path
  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length <= 1) return `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(points);

  // Area path closing at baseline
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className={cn('w-full space-y-2 select-none', className)}>
      {/* Top Banner Metric Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-[#0052CC] border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
          <div>
            <span className="text-[11px] font-bold text-slate-500">Average Performance: </span>
            <span className="font-mono font-black text-[#0B2447] text-sm">{averageScore}%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl">
          <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Peak Score: {highestScore}%</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          style={{ maxHeight: height }}
        >
          <defs>
            {/* Linear gradient for area fill */}
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052CC" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.0" />
            </linearGradient>

            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0052CC" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          {[25, 50, 75, 100].map((level) => {
            const y = paddingTop + chartHeight - (level / maxVal) * chartHeight;
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9.5px] fill-slate-400 font-mono font-bold"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Average Reference Line */}
          {showAverageLine && (
            <g>
              <line
                x1={paddingX}
                y1={avgY}
                x2={width - paddingX}
                y2={avgY}
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text
                x={width - paddingX + 5}
                y={avgY + 3}
                className="text-[9px] fill-emerald-600 font-extrabold"
              >
                Avg {averageScore}%
              </text>
            </g>
          )}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#trendAreaGradient)" />}

          {/* Main Curved Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0052CC"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const isPeak = pt.score === highestScore;

            return (
              <g key={idx} className="cursor-pointer">
                {/* Invisible large target for easy mobile touch */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={16}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(isHovered ? null : idx)}
                />

                {/* Visible Point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : isPeak ? 6 : 4.5}
                  fill={isPeak ? '#F59E0B' : '#0052CC'}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 3 : 2}
                  filter="url(#pointShadow)"
                  className="transition-all duration-200"
                />

                {/* X-Axis Label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={cn(
                    'text-[10px] font-bold transition-colors truncate',
                    isHovered ? 'fill-[#0052CC] font-black' : 'fill-slate-500',
                  )}
                >
                  {pt.label.length > 10 ? pt.label.substring(0, 9) + '…' : pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5 border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 8}%`,
            }}
          >
            <p className="font-black text-white text-xs whitespace-nowrap">{hoveredPoint.label}</p>
            <div className="flex items-center gap-2 font-mono text-[11px] text-blue-200">
              <span className="font-bold">Score:</span>
              <span className="font-black text-white">{hoveredPoint.score}%</span>
              {hoveredPoint.marks !== undefined && (
                <span className="text-slate-400">
                  ({hoveredPoint.marks}/{hoveredPoint.maxMarks || 720})
                </span>
              )}
            </div>
            {hoveredPoint.date && (
              <p className="text-[9.5px] text-slate-400">
                {new Date(hoveredPoint.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
