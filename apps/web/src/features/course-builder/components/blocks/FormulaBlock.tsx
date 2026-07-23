'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, FormulaBlockContent, BlockContent } from '../../types';

interface FormulaBlockProps {
  item: TopicItem;
  content: FormulaBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function FormulaBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: FormulaBlockProps) {
  const [formula, setFormula] = useState(content.formula || '');
  const [description, setDescription] = useState(content.description || '');

  const handleSave = useCallback(() => {
    onSave(item, { blockType: 'FORMULA', formula, description });
  }, [item, formula, description, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-indigo-100">
            <span className="text-lg font-bold text-indigo-600">ƒ</span>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Formula
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Formula
              </label>
              <input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g. F = ma"
                className="w-full h-9 px-3 text-sm font-mono rounded-lg border border-indigo-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Force equals mass multiplied by acceleration"
                className="w-full h-9 px-3 text-sm rounded-lg border border-indigo-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancelEdit}
            className="h-8 px-3 rounded-xl text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 h-8 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(item)}
      className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/50 cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold text-indigo-600">ƒ</span>
        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Formula</span>
      </div>
      {formula ? (
        <div>
          <p className="text-lg font-mono font-bold text-indigo-900 mb-1">{formula}</p>
          {description && <p className="text-sm text-indigo-600">{description}</p>}
        </div>
      ) : (
        <p className="text-sm text-indigo-400 italic">Click to add formula...</p>
      )}
    </div>
  );
}
