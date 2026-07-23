'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, TableBlockContent, BlockContent } from '../../types';

interface TableBlockProps {
  item: TopicItem;
  content: TableBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function TableBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: TableBlockProps) {
  const [editHtml, setEditHtml] = useState(content.html || '');
  const [caption, setCaption] = useState(content.caption || '');

  const handleSave = useCallback(() => {
    onSave(item, { blockType: 'TABLE', html: editHtml, caption });
  }, [item, editHtml, caption, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
            <span className="text-lg">📊</span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Table</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Caption (optional)
              </label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Table caption"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Table HTML
              </label>
              <textarea
                value={editHtml}
                onChange={(e) => setEditHtml(e.target.value)}
                placeholder="<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Data</td><td>Data</td></tr></tbody></table>"
                rows={5}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              />
            </div>
            {editHtml && (
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: editHtml }}
                />
              </div>
            )}
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
    <div onClick={() => onStartEdit(item)} className="cursor-pointer group">
      {editHtml ? (
        <div className="space-y-1">
          {caption && <p className="text-xs font-semibold text-gray-600 mb-1">{caption}</p>}
          <div
            className="prose prose-sm max-w-none overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: editHtml }}
          />
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors">
          <p className="text-lg mb-1">📊</p>
          <p className="text-sm text-gray-400 italic">Click to add table...</p>
        </div>
      )}
    </div>
  );
}
