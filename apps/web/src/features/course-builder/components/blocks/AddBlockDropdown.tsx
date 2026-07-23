'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { BlockType, MediaBlockType, AddableBlockType } from '../../types';
import { BLOCK_TYPE_CONFIGS, MEDIA_BLOCK_CONFIGS } from '../../types';

interface AddBlockDropdownProps {
  onSelect: (id: AddableBlockType) => void;
}

export function AddBlockDropdown({ onSelect }: AddBlockDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleSelect = (id: AddableBlockType) => {
    onSelect(id);
    setOpen(false);
  };

  const availableBlocks = BLOCK_TYPE_CONFIGS.filter((cfg) => {
    if (cfg.blockType === 'TABLE') return false;
    return true;
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 transition-all group"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Block</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-2 max-h-80 overflow-y-auto min-w-[260px] sm:min-w-0">
          {/* Media blocks section */}
          <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Media & Resources
          </div>
          {MEDIA_BLOCK_CONFIGS.map((cfg) => (
            <button
              key={cfg.mediaType}
              onClick={() => handleSelect(cfg.mediaType)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-violet-50/60 transition-colors text-left"
            >
              <span className="text-base w-6 text-center shrink-0">{cfg.icon}</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-700 block">{cfg.label}</span>
                <span className="text-[9px] text-gray-400">{cfg.description}</span>
              </div>
            </button>
          ))}

          <div className="border-t border-gray-100 my-1.5 mx-3" />

          {/* Content blocks section */}
          <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Content Blocks
          </div>
          {availableBlocks.map((cfg) => (
            <button
              key={cfg.blockType}
              onClick={() => handleSelect(cfg.blockType)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-violet-50/60 transition-colors text-left"
            >
              <span className="text-base w-6 text-center shrink-0">{cfg.icon}</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-700 block">{cfg.label}</span>
                <span className="text-[9px] text-gray-400">{cfg.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
