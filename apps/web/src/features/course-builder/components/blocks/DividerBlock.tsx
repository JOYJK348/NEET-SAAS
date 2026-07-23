'use client';

import type { TopicItem } from '../../types';

interface DividerBlockProps {
  item: TopicItem;
  onDelete: (item: TopicItem) => void;
}

export function DividerBlock({ item, onDelete }: DividerBlockProps) {
  return (
    <div className="group relative flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-gray-200" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider"
      >
        Remove
      </button>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
