'use client';

import { useState } from 'react';
import { Plus, Sparkles, X, Layers, Video, FileText, Link as LinkIcon, Lightbulb, Star, Sigma, GraduationCap, HelpCircle, Minus, Image as ImageIcon } from 'lucide-react';
import type { AddableBlockType } from '../../types';
import { BLOCK_TYPE_CONFIGS, MEDIA_BLOCK_CONFIGS } from '../../types';
import { cn } from '@/lib/utils';

interface AddBlockDropdownProps {
  onSelect: (id: AddableBlockType) => void;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  KEY_CONCEPT: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200 hover:border-amber-400' },
  FORMULA: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200 hover:border-violet-400' },
  WORKED_EXAMPLE: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200 hover:border-indigo-400' },
  PRACTICE_QUESTION: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200 hover:border-emerald-400' },
  IMPORTANT_NOTE: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200 hover:border-rose-400' },
  TEXT: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200 hover:border-slate-400' },
  PDF: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200 hover:border-red-400' },
  VIDEO: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200 hover:border-blue-400' },
  LINK: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200 hover:border-sky-400' },
  IMAGE: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200 hover:border-purple-400' },
  DIVIDER: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200 hover:border-gray-400' },
};

export function AddBlockDropdown({ onSelect }: AddBlockDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: AddableBlockType) => {
    onSelect(id);
    setOpen(false);
  };

  const availableBlocks = BLOCK_TYPE_CONFIGS.filter((cfg) => cfg.blockType !== 'TABLE');
  const allBlocks = [
    ...MEDIA_BLOCK_CONFIGS.map((m) => ({ id: m.mediaType, label: m.label, desc: m.description, icon: m.icon })),
    ...availableBlocks.map((b) => ({ id: b.blockType, label: b.label, desc: b.description, icon: b.icon })),
  ];

  if (!open) {
    return (
      <div className="my-3">
        <button
          onClick={() => setOpen(true)}
          className="group relative flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#7c3aed]/30 hover:border-[#7c3aed] bg-white hover:bg-violet-50/50 text-[#7c3aed] text-xs font-extrabold transition-all duration-200 shadow-2xs hover:shadow-md"
        >
          <div className="w-6 h-6 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
            <Plus className="h-4 w-4" />
          </div>
          <span className="uppercase tracking-wider">Add Content Block</span>
          <Sparkles className="h-4 w-4 text-amber-500 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="my-4 p-5 rounded-3xl bg-white border-2 border-[#7c3aed]/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center text-xs shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Block Type to Add 🎨</h4>
            <p className="text-[10px] text-slate-400 font-medium">Click any card below to immediately insert block</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          title="Close Palette"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of All Blocks - NO SCROLLBAR AT ALL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {allBlocks.map((blk) => {
          const style = colorMap[blk.id] || colorMap.TEXT;
          return (
            <button
              key={blk.id}
              onClick={() => handleSelect(blk.id as AddableBlockType)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group',
                'bg-slate-50/50 hover:bg-white',
                style.border,
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border transition-transform group-hover:scale-110 shadow-2xs', style.bg, style.border)}>
                {blk.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-slate-800 block truncate group-hover:text-[#7c3aed] transition-colors">{blk.label}</span>
                <span className="text-[10px] text-slate-400 block truncate font-medium">{blk.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
