'use client';

import { useState, useCallback, useRef } from 'react';
import { Video } from 'lucide-react';
import type { TopicItem } from '../../types';
import { ExternalLinkForm } from '../ExternalLinkForm';

interface VideoBlockProps {
  item: TopicItem;
  isEditing: boolean;
  onSave: (item: TopicItem, payload: Record<string, unknown>) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function VideoBlock({
  item,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: VideoBlockProps) {
  const [editExternalUrl, setEditExternalUrl] = useState<string | undefined>(
    item.externalUrl ?? undefined,
  );
  const [editMetadata, setEditMetadata] = useState<Record<string, unknown> | undefined>(
    item.metadata ?? undefined,
  );
  const formKey = useRef(0);

  const isYoutube =
    item.externalUrl?.includes('youtube.com') || item.externalUrl?.includes('youtu.be');
  const isVimeo = item.externalUrl?.includes('vimeo.com');
  const embedUrl = isYoutube
    ? item.externalUrl?.replace('watch?v=', 'embed/').split('&')[0]
    : isVimeo
      ? item.externalUrl?.replace('vimeo.com', 'player.vimeo.com/video')
      : null;

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
        <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-purple-100">
            <Video className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Video
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
    <div
      onClick={() => {
        formKey.current++;
        onStartEdit(item);
      }}
      className="border border-gray-200 rounded-xl overflow-hidden bg-white cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 shrink-0">
          <Video className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">{item.title || 'Video'}</p>
          {item.externalUrl && (
            <p className="text-[10px] text-gray-400 truncate">{item.externalUrl}</p>
          )}
        </div>
        {item.durationMins && (
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
            {item.durationMins} min
          </span>
        )}
      </div>
      {embedUrl ? (
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : item.externalUrl ? (
        <div className="p-4">
          <p className="text-xs text-gray-400">Video URL configured — click to edit</p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-xs text-gray-400 italic">Click to add video URL...</p>
        </div>
      )}
    </div>
  );
}
