'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, TextBlockContent, BlockContent } from '../../types';
import { RichTextEditor } from './RichTextEditor';

interface TextBlockProps {
  item: TopicItem;
  content: TextBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function TextBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: TextBlockProps) {
  const [editHtml, setEditHtml] = useState(content.html || '');

  const handleSave = useCallback(() => {
    onSave(item, {
      blockType: 'TEXT',
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
        <RichTextEditor
          html={editHtml}
          onChange={(html) => setEditHtml(html)}
          placeholder="Type your content here..."
        />
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
      {content.html ? (
        <div
          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-violet-600 prose-strong:text-gray-900 prose-code:text-violet-700 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <p className="text-sm text-gray-400 italic py-2">Click to add text content...</p>
      )}
    </div>
  );
}
