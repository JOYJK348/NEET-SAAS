'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import type { TopicItem } from '../../types';
import { PdfDocumentForm } from '../PdfDocumentForm';

interface UploadDocumentBlockProps {
  item: TopicItem;
  isEditing: boolean;
  onSave: (item: TopicItem, payload: Record<string, unknown>) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function UploadDocumentBlock({
  item,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: UploadDocumentBlockProps) {
  const meta = (item.metadata ?? {}) as any;
  const [editFileUrl, setEditFileUrl] = useState<string | undefined>(item.fileUrl ?? undefined);
  const [editMetadata, setEditMetadata] = useState<Record<string, unknown> | undefined>(
    item.metadata ?? undefined,
  );
  const formKey = useRef(0);

  const handleChange = useCallback(
    (data: {
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (data.fileUrl) setEditFileUrl(data.fileUrl);
      if (data.metadata) setEditMetadata(data.metadata);
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(item, {
      fileUrl: editFileUrl || null,
      metadata: editMetadata,
    });
  }, [item, editFileUrl, editMetadata, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-red-100">
            <FileText className="h-4 w-4 text-red-600" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
              Upload Document
            </span>
          </div>
          <div className="p-3">
            <PdfDocumentForm
              key={formKey.current}
              fileUrl={editFileUrl ?? item.fileUrl}
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
    <div
      onClick={() => {
        formKey.current++;
        onStartEdit(item);
      }}
      className="border border-gray-200 rounded-xl p-4 bg-white cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 shrink-0">
          <FileText className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {meta.fileName ?? item.title}
          </p>
          <p className="text-xs text-gray-400">
            {meta.pageCount ? `${meta.pageCount} pages` : ''}
            {meta.pageCount && meta.fileSizeBytes ? ' · ' : ''}
            {meta.fileSizeBytes ? `${(meta.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
          </p>
        </div>
        {item.fileUrl && (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            View
          </a>
        )}
      </div>
      {!item.fileUrl && (
        <p className="text-xs text-gray-400 italic mt-2">Click to upload document...</p>
      )}
    </div>
  );
}
