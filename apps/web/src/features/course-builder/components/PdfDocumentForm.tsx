'use client';

import { useState, useRef } from 'react';
import { File, Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function PdfDocumentForm({
  fileUrl,
  metadata,
  onChange,
}: {
  fileUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  onChange?: (data: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    metadata?: Record<string, unknown>;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(
    fileUrl
      ? {
          name: (metadata?.fileName as string) ?? fileUrl.split('/').pop() ?? 'document.pdf',
          size: (metadata?.fileSize as number) ?? 0,
        }
      : null,
  );
  const [pageCount, setPageCount] = useState((metadata?.pageCount as number) ?? 0);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile({ name: f.name, size: f.size });
    const url = URL.createObjectURL(f);
    onChange?.({
      fileUrl: url,
      fileName: f.name,
      fileSize: f.size,
      metadata: { pageCount, fileName: f.name, fileSize: f.size },
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          dragOver
            ? 'border-violet-400 bg-violet-50'
            : 'border-gray-200 bg-gray-50/50 hover:border-violet-300 hover:bg-violet-50/30',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex items-center justify-center w-12 h-14 rounded-xl bg-red-50 border border-red-100 shrink-0">
              <File className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                onChange?.({ fileUrl: undefined, fileName: undefined, fileSize: undefined });
              }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 mb-3">
              <Upload className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-xs font-bold text-gray-600 mb-0.5">Upload PDF</p>
            <p className="text-[10px] text-gray-400">Drag & drop or click to browse</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Pages
          </label>
          <Input
            type="number"
            min={0}
            value={pageCount || ''}
            onChange={(e) => setPageCount(Number(e.target.value))}
            placeholder="0"
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            File Type
          </label>
          <div className="flex items-center h-9 px-3 text-xs text-gray-500 rounded-xl border border-gray-200 bg-gray-50">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-red-400" />
            PDF
          </div>
        </div>
      </div>
    </div>
  );
}
