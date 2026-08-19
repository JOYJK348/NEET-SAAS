'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Download,
  Eye,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PdfDocumentInfo {
  id: string;
  name: string;
  url: string;
  category: string;
  totalPages: number;
  fileType?: 'pdf' | 'image';
}

export const SAMPLE_NEET_DOCUMENTS: PdfDocumentInfo[] = [
  {
    id: 'sample-biology-notes',
    name: 'NEET Biology - Cell Structure & Genetics Summary.pdf',
    category: 'Biology',
    totalPages: 8,
    fileType: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'sample-physics-mechanics',
    name: 'NEET Physics - Mechanics Formula & Problems.pdf',
    category: 'Physics',
    totalPages: 10,
    fileType: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'sample-chemistry-reactions',
    name: 'NEET Chemistry - Organic Reaction Mechanisms.pdf',
    category: 'Chemistry',
    totalPages: 12,
    fileType: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

interface StudioPdfPresenterProps {
  isTeacher?: boolean;
  activeDoc?: PdfDocumentInfo | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onDocChange?: (doc: PdfDocumentInfo) => void;
  onClose?: () => void;
}

export default function StudioPdfPresenter({
  isTeacher = true,
  activeDoc: propDoc,
  currentPage: propPage = 1,
  onPageChange,
  onDocChange,
  onClose,
}: StudioPdfPresenterProps) {
  const [selectedDoc, setSelectedDoc] = useState<PdfDocumentInfo | null>(propDoc || null);
  const [currentPage, setCurrentPage] = useState<number>(propPage);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (propDoc) {
      setSelectedDoc(propDoc);
    }
  }, [propDoc]);

  useEffect(() => {
    if (propPage) {
      setCurrentPage(propPage);
    }
  }, [propPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const next = currentPage - 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  const handleNextPage = () => {
    const total = selectedDoc?.totalPages || 20;
    if (currentPage < total) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  const handleSelectDocument = (doc: PdfDocumentInfo) => {
    setSelectedDoc(doc);
    setCurrentPage(1);
    setShowPicker(false);
    onDocChange?.(doc);
    onPageChange?.(1);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      toast.error('Please upload a PDF document (.pdf) or image file (.png, .jpg)');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        const customDoc: PdfDocumentInfo = {
          id: `custom-${Date.now()}`,
          name: file.name,
          url: dataUrl,
          category: 'Uploaded Document',
          totalPages: isPdf ? 15 : 1,
          fileType: isPdf ? 'pdf' : 'image',
        };

        handleSelectDocument(customDoc);
        toast.success(`📄 "${file.name}" loaded successfully!`);
      } catch (err) {
        toast.error('Failed to parse uploaded document.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file from your device.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleCustomUploadEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset file input so same file can be re-uploaded if modified
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isTeacher) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full h-full bg-slate-950 flex flex-col relative overflow-hidden text-slate-100 select-none"
    >
      {/* ── Top Header Toolbar ── */}
      <div className="h-12 sm:h-14 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs sm:text-sm font-black text-slate-100 truncate">
                {selectedDoc ? selectedDoc.name : 'PDF & Notes Presenter'}
              </span>
              {selectedDoc && (
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold shrink-0 hidden sm:inline">
                  {selectedDoc.category}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {isTeacher
                ? 'Presenter Controls • Pages live-synced to all students'
                : 'Synchronized Live Presentation'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isTeacher && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Upload PDF or Image from your phone/laptop"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Loading...' : 'Upload File'}</span>
              </button>

              <button
                onClick={() => setShowPicker(!showPicker)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Select Material"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Materials</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleCustomUploadEvent}
              />
            </>
          )}

          {/* Zoom controls */}
          {selectedDoc && (
            <div className="hidden md:flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setZoom((z) => Math.max(70, z - 15))}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-300">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(160, z + 15))}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {isTeacher && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-600/80 rounded-xl border border-rose-500/30 transition cursor-pointer"
              title="Close Presentation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Material Picker Dropdown Overlay ── */}
      {showPicker && isTeacher && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/98 border border-slate-700 rounded-2xl shadow-2xl z-30 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-slate-200">Select Presentation Material</span>
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {SAMPLE_NEET_DOCUMENTS.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isSelected ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{doc.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {doc.category} • {doc.totalPages} Pages
                      </span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 active:scale-95 border border-dashed border-indigo-500/60 text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File from Device
            </button>
          </div>
        </div>
      )}

      {/* ── Main Presentation Canvas Stage ── */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-slate-950">
        {selectedDoc ? (
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
            className="w-full h-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative transition-transform duration-150"
          >
            {/* Real PDF / Image Display Frame */}
            {selectedDoc.fileType === 'image' || selectedDoc.url.startsWith('data:image/') ? (
              <div className="w-full h-full flex items-center justify-center p-2 bg-slate-950 overflow-auto">
                <img
                  src={selectedDoc.url}
                  alt={selectedDoc.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <iframe
                src={`${selectedDoc.url}#page=${currentPage}&view=FitH&toolbar=0`}
                className="w-full h-full rounded-2xl bg-white border-0"
                title={selectedDoc.name}
              />
            )}
          </div>
        ) : (
          /* Empty Initial State: Upload Dropzone */
          <div className="flex flex-col items-center justify-center max-w-md w-full p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white">
                {isTeacher ? 'Upload Presentation Document' : 'Waiting for Presentation'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTeacher
                  ? 'Select any PDF file, question paper, or chapter notes from your phone or computer to present live.'
                  : 'Your tutor will share study materials and question papers here shortly.'}
              </p>
            </div>

            {isTeacher && (
              <div className="w-full space-y-2.5 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Reading file...' : 'Choose PDF from Device 📁'}</span>
                </button>

                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Or Pick Sample Material</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Presentation Page Navigator ── */}
      {selectedDoc && (
        <div className="h-12 sm:h-14 bg-slate-900/95 border-t border-slate-800 px-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || !isTeacher}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
              currentPage <= 1 || !isTeacher
                ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              Page <span className="text-white font-black">{currentPage}</span>
              {selectedDoc.totalPages ? ` / ${selectedDoc.totalPages}` : ''}
            </span>
            {!isTeacher && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced Live
              </span>
            )}
          </div>

          <button
            onClick={handleNextPage}
            disabled={
              !isTeacher ||
              (selectedDoc.totalPages ? currentPage >= selectedDoc.totalPages : false)
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
              !isTeacher ||
              (selectedDoc.totalPages ? currentPage >= selectedDoc.totalPages : false)
                ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer active:scale-95'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
