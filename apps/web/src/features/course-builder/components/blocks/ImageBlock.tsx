'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, ImageBlockContent, BlockContent } from '../../types';

interface ImageBlockProps {
  item: TopicItem;
  content: ImageBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function ImageBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: ImageBlockProps) {
  const [url, setUrl] = useState(content.url || '');
  const [caption, setCaption] = useState(content.caption || '');
  const [altText, setAltText] = useState(content.altText || '');

  const handleSave = useCallback(() => {
    onSave(item, { blockType: 'IMAGE', url, caption, altText });
  }, [item, url, caption, altText, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
            <span className="text-lg">🖼️</span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Image</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Image URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Alt Text
              </label>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Caption (optional)
              </label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Image caption"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            {url && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={url}
                  alt={altText || 'Preview'}
                  className="max-h-48 w-full object-contain bg-gray-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
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
      {url ? (
        <div className="space-y-1">
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img
              src={url}
              alt={altText || ''}
              className="w-full object-contain max-h-96 bg-gray-50"
            />
          </div>
          {caption && <p className="text-xs text-gray-500 text-center italic">{caption}</p>}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors">
          <p className="text-lg mb-1">🖼️</p>
          <p className="text-sm text-gray-400 italic">Click to add image...</p>
        </div>
      )}
    </div>
  );
}
