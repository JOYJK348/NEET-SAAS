'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, ImportantNoteBlockContent, BlockContent } from '../../types';
import { RichTextEditor } from './RichTextEditor';

interface ImportantNoteBlockProps {
  item: TopicItem;
  content: ImportantNoteBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function ImportantNoteBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: ImportantNoteBlockProps) {
  const [editHtml, setEditHtml] = useState(content.html || '');

  const handleSave = useCallback(() => {
    onSave(item, {
      blockType: 'IMPORTANT_NOTE',
      html: editHtml,
      wordCount: editHtml
        .replace(/<[^>]*>/g, '')
        .split(/\s+/)
        .filter(Boolean).length,
    });
  }, [item, editHtml, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100">
            <span className="text-lg">⭐</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Important Note
            </span>
          </div>
          <RichTextEditor
            html={editHtml}
            onChange={(html) => setEditHtml(html)}
            placeholder="Write important information here..."
            minHeight="100px"
          />
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
      className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⭐</span>
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
          Important Note
        </span>
      </div>
      {content.html ? (
        <div
          className="prose prose-sm max-w-none prose-p:text-amber-800 prose-headings:text-amber-900"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <p className="text-sm text-amber-400 italic">Click to add important note...</p>
      )}
    </div>
  );
}
