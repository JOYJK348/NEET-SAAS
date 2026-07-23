'use client';

import { useState, useCallback, useRef } from 'react';
import { Link, ExternalLink } from 'lucide-react';
import type { TopicItem } from '../../types';
import { ExternalLinkForm } from '../ExternalLinkForm';

interface ExternalLinkBlockProps {
  item: TopicItem;
  isEditing: boolean;
  onSave: (item: TopicItem, payload: Record<string, unknown>) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function ExternalLinkBlock({
  item,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: ExternalLinkBlockProps) {
  const [editExternalUrl, setEditExternalUrl] = useState<string | undefined>(
    item.externalUrl ?? undefined,
  );
  const [editMetadata, setEditMetadata] = useState<Record<string, unknown> | undefined>(
    item.metadata ?? undefined,
  );
  const formKey = useRef(0);

  const meta = (item.metadata ?? {}) as any;
  const domain = item.externalUrl
    ? (() => {
        try {
          return new URL(item.externalUrl).hostname.replace('www.', '');
        } catch {
          return item.externalUrl;
        }
      })()
    : '';

  const handleChange = useCallback(
    (data: { externalUrl: string; metadata?: Record<string, unknown> }) => {
      setEditExternalUrl(data.externalUrl);
      if (data.metadata) setEditMetadata(data.metadata);
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(item, {
      externalUrl: editExternalUrl || null,
      metadata: editMetadata,
    });
  }, [item, editExternalUrl, editMetadata, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-blue-100">
            <Link className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              External Link
            </span>
          </div>
          <div className="p-3">
            <ExternalLinkForm
              key={formKey.current}
              externalUrl={editExternalUrl ?? item.externalUrl}
              metadata={editMetadata ?? item.metadata}
              onChange={handleChange}
            />
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
    <a
      href={item.externalUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!item.externalUrl) {
          e.preventDefault();
          onStartEdit(item);
        }
      }}
      className="block border border-gray-200 rounded-xl p-4 bg-white cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 shrink-0">
          <Link className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors truncate">
            {item.description || item.title || 'External Link'}
          </p>
          {domain && <p className="text-xs text-gray-400 mt-0.5">{domain}</p>}
        </div>
        {item.externalUrl && (
          <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0 mt-1" />
        )}
      </div>
      {!item.externalUrl && (
        <p className="text-xs text-gray-400 italic mt-2">Click to add URL...</p>
      )}
    </a>
  );
}
