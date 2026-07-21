'use client';

import { useState } from 'react';
import { FileText, File, Link, Video, ClipboardCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { TopicItemType } from '../types';

interface ContentTypeOption {
  type: TopicItemType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const options: ContentTypeOption[] = [
  {
    type: 'TEXT',
    title: 'Text Lesson',
    description: 'Write rich text content with formatting, images, and more',
    icon: <FileText className="h-6 w-6" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 border-sky-200 hover:bg-sky-100',
  },
  {
    type: 'PDF',
    title: 'PDF Document',
    description: 'Upload a PDF file for students to view or download',
    icon: <File className="h-6 w-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    type: 'LINK',
    title: 'External Link',
    description: 'Link to YouTube, articles, or any external resource',
    icon: <Link className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    type: 'VIDEO',
    title: 'Video',
    description: 'Embed a video from YouTube, Vimeo, or direct URL',
    icon: <Video className="h-6 w-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    type: 'ASSESSMENT',
    title: 'Assessment',
    description: 'Link an existing exam or quiz to this topic',
    icon: <ClipboardCheck className="h-6 w-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
];

export function AddContentPickerModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: TopicItemType) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-100">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-black">Add Content</DialogTitle>
              <DialogDescription className="text-[11px]">
                Choose the type of learning content to create
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              onMouseEnter={() => setHovered(opt.type)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'flex items-start gap-3 w-full p-3 rounded-2xl border-2 text-left transition-all',
                opt.bgColor,
                hovered === opt.type ? 'shadow-md' : 'shadow-sm',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl bg-white border shrink-0',
                  opt.color,
                )}
              >
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn('text-sm font-bold', opt.color)}>{opt.title}</span>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
