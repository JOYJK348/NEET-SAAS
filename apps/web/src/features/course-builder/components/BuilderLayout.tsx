'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Eye, Send, PanelRight, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderLayoutProps {
  courseId: string;
  courseName: string;
  courseStatus?: string;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const statusConfig: Record<string, { label: string; icon: string }> = {
  DRAFT: { label: 'Draft', icon: '🟡' },
  PUBLISHED: { label: 'Published', icon: '🟢' },
  ARCHIVED: { label: 'Archived', icon: '📁' },
};

export function BuilderLayout({
  courseId,
  courseName,
  courseStatus = 'DRAFT',
  leftPanel,
  centerPanel,
  rightPanel,
}: BuilderLayoutProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null);

  const status = useMemo(
    () => statusConfig[courseStatus] ?? { label: courseStatus, icon: '🟡' },
    [courseStatus],
  );

  const toggleMobilePanel = (panel: 'left' | 'right') => {
    setMobilePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="sticky top-0 z-50 h-[52px] shrink-0 bg-[#0f0a1e] flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/tenant-admin/courses/${courseId}`}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-white font-bold text-sm truncate">{courseName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all border border-white/10"
            >
              <span className="text-xs leading-none">{status.icon}</span>
              <span>{status.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 overflow-hidden">
                  {Object.entries(statusConfig).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setStatusOpen(false)}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-left transition-colors',
                        key === courseStatus
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <span className="text-xs leading-none">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            disabled
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/20 text-white/40 text-xs font-semibold cursor-not-allowed"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'w-[280px] border-r border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden md:block',
            mobilePanel === 'left' && '!block fixed inset-0 z-30 pt-[52px] w-full',
          )}
        >
          {leftPanel}
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 bg-white">{centerPanel}</main>

        <aside
          className={cn(
            'w-[280px] border-l border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden md:block',
            mobilePanel === 'right' && '!block fixed inset-0 z-30 pt-[52px] w-full',
          )}
        >
          {rightPanel}
        </aside>
      </div>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0f0a1e] rounded-2xl px-3 py-2 shadow-2xl border border-white/10">
        <button
          onClick={() => toggleMobilePanel('left')}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all',
            mobilePanel === 'left'
              ? 'bg-violet-600 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10',
          )}
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
          Outline
        </button>
        <button
          onClick={() => toggleMobilePanel('right')}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all',
            mobilePanel === 'right'
              ? 'bg-violet-600 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10',
          )}
        >
          <PanelRight className="h-3.5 w-3.5" />
          Properties
        </button>
      </div>
    </div>
  );
}
