'use client';

// NEET Studio Live Class Presentation Engine v1.2.0
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
    name: 'NEET Biology - High Yield Study Summary.pdf',
    category: 'Biology',
    totalPages: 5,
    fileType: 'pdf',
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 'sample-physics-mechanics',
    name: 'NEET Physics - Mechanics & Formulae Sheet.pdf',
    category: 'Physics',
    totalPages: 8,
    fileType: 'pdf',
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 'sample-chemistry-reactions',
    name: 'NEET Chemistry - Organic Mechanisms & Notes.pdf',
    category: 'Chemistry',
    totalPages: 6,
    fileType: 'pdf',
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
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
  const [totalPages, setTotalPages] = useState<number>(propDoc?.totalPages || 1);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const loadedDocKeyRef = useRef<string>('');
  const isRenderingRef = useRef<boolean>(false);

  // Sync prop changes safely by key
  useEffect(() => {
    if (propDoc) {
      const newKey = `${propDoc.id}_${propDoc.url}`;
      if (newKey !== loadedDocKeyRef.current) {
        setSelectedDoc(propDoc);
        if (propDoc.totalPages) {
          setTotalPages(propDoc.totalPages);
        }
      }
    }
  }, [propDoc]);

  useEffect(() => {
    if (propPage && propPage !== currentPage) {
      setCurrentPage(propPage);
    }
  }, [propPage, currentPage]);

  // Dynamically load PDF.js engine
  const getPdfJs = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    try {
      const pdfjs = await import('pdfjs-dist');
      if (pdfjs && pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        (window as any).pdfjsLib = pdfjs;
        return pdfjs;
      }
    } catch {}

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const cdnPdfJs = (window as any).pdfjsLib;
        if (cdnPdfJs) {
          cdnPdfJs.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(cdnPdfJs);
        } else {
          reject(new Error('PDF.js not available'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF engine'));
      document.head.appendChild(script);
    });
  }, []);

  // Render a specific page onto the canvas
  const renderPdfPage = useCallback(
    async (pageNumber: number, currentZoom: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const maxPage = pdfDocRef.current.numPages || totalPages;
        const pageNum = Math.max(1, Math.min(pageNumber, maxPage));
        const page = await pdfDocRef.current.getPage(pageNum);
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const baseScale = (currentZoom / 100) * 1.5;
        const viewport = page.getViewport({ scale: baseScale });

        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF Render:', err);
        }
      }
    },
    [totalPages],
  );

  // Load and Parse PDF Document ONLY when document ID/URL changes
  useEffect(() => {
    if (!selectedDoc || selectedDoc.fileType === 'image') {
      pdfDocRef.current = null;
      loadedDocKeyRef.current = '';
      setIsInitialLoading(false);
      return;
    }

    const docKey = `${selectedDoc.id}_${selectedDoc.url}`;
    if (docKey === loadedDocKeyRef.current) {
      // Document already loaded in memory, just render active page
      renderPdfPage(currentPage, zoom);
      return;
    }

    let isCancelled = false;
    setIsInitialLoading(true);

    const loadDoc = async () => {
      try {
        const pdfjs = await getPdfJs();
        if (!pdfjs || isCancelled) return;

        let pdf: any = null;

        if (selectedDoc.url.startsWith('data:')) {
          const base64Data = selectedDoc.url.split(',')[1];
          const raw = atob(base64Data);
          const uint8Array = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) {
            uint8Array[i] = raw.charCodeAt(i);
          }
          pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
        } else {
          try {
            pdf = await pdfjs.getDocument({ url: selectedDoc.url, withCredentials: false }).promise;
          } catch (directErr) {
            console.warn('Direct PDF.js URL fetch failed, trying ArrayBuffer fetch fallback...', directErr);
            const resp = await fetch(selectedDoc.url);
            const buffer = await resp.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
          }
        }

        if (isCancelled) return;

        pdfDocRef.current = pdf;
        loadedDocKeyRef.current = docKey;
        const realPages = pdf?.numPages || 1;
        setTotalPages(realPages);
        setIsInitialLoading(false);

        // Render page onto canvas immediately
        renderPdfPage(currentPage, zoom);
      } catch (err: any) {
        console.error('PDF.js Load Error:', err);
        if (!isCancelled) {
          setIsInitialLoading(false);
          toast.error('Could not render PDF document.');
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [selectedDoc, getPdfJs, renderPdfPage, currentPage, zoom]);

  // Page turns / zoom changes render cleanly on existing canvas
  useEffect(() => {
    if (pdfDocRef.current && loadedDocKeyRef.current && selectedDoc?.fileType !== 'image') {
      renderPdfPage(currentPage, zoom);
    }
  }, [currentPage, zoom, renderPdfPage, selectedDoc]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const next = currentPage - 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  const handleSelectDocument = (doc: PdfDocumentInfo) => {
    setSelectedDoc(doc);
    setCurrentPage(1);
    setTotalPages(doc.totalPages || 1);
    setShowPicker(false);
    onDocChange?.(doc);
    onPageChange?.(1);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      toast.error('Please upload a valid PDF (.pdf) or image (.png, .jpg)');
      return;
    }

    setIsUploading(true);

    try {
      let shareUrl: string | null = null;

      // 1. Upload file to Cloud Storage for cross-device sharing
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('moduleCode', 'LIVE_CLASS');
        formData.append('fileType', 'DOCUMENT');

        const res: any = await api.post('/storage/upload?expiresIn=604800', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipGlobalToast: true,
        });
        shareUrl = res?.signedUrl || res?.fileUrl || res?.url || res?.storagePath || res?.key || null;
      } catch (uploadErr) {
        console.warn('[Studio PDF] Storage upload fallback to local Data URL:', uploadErr);
      }

      // 2. Read file to count pages & generate local fallback Data URL if storage was unavailable
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          let detectedPages = 1;

          if (isPdf) {
            try {
              const pdfjs = await getPdfJs();
              if (pdfjs) {
                const base64Data = dataUrl.split(',')[1];
                const raw = atob(base64Data);
                const uint8Array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                  uint8Array[i] = raw.charCodeAt(i);
                }
                const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
                detectedPages = pdf.numPages || 1;
              }
            } catch {
              detectedPages = 1;
            }
          }

          const finalUrl = shareUrl || dataUrl;

          const customDoc: PdfDocumentInfo = {
            id: `custom-${Date.now()}`,
            name: file.name,
            url: finalUrl,
            category: 'Uploaded Document',
            totalPages: detectedPages,
            fileType: isPdf ? 'pdf' : 'image',
          };

          handleSelectDocument(customDoc);
          toast.success(
            `📄 "${file.name}" ready (${detectedPages} page${detectedPages > 1 ? 's' : ''})!`,
          );
        } catch (err) {
          toast.error('Failed to parse uploaded document.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Error reading file.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleCustomUploadEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
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
      className="w-full h-full bg-slate-950 flex flex-col relative overflow-hidden text-slate-100 select-none studio-pdf-container"
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
                ? 'Presenter Mode • Pages live-synced to all students'
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
                title="Upload PDF or Image from device"
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
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-300">{zoom}%</span>
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

      {/* ── Material Picker Modal Dropdown ── */}
      {showPicker && isTeacher && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/98 border border-slate-700 rounded-2xl shadow-2xl z-30 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-slate-200">
                Select Presentation Material
              </span>
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

      {/* ── Main Presentation Stage ── */}
      <div className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950">
        {isInitialLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-300">Loading document...</p>
          </div>
        )}

        {selectedDoc ? (
          <div className="w-full h-full flex items-center justify-center relative overflow-auto p-1 sm:p-2">
            {selectedDoc.fileType === 'image' || selectedDoc.url.startsWith('data:image/') ? (
              <img
                src={selectedDoc.url}
                alt={selectedDoc.name}
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                }}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-150"
              />
            ) : (
              /* High-Res HTML5 Canvas for PDF.js Rendering */
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                }}
                className="shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-800 transition-transform duration-150 flex items-center justify-center"
              >
                <canvas ref={canvasRef} className="max-w-full max-h-[85vh] object-contain block" />
              </div>
            )}
          </div>
        ) : (
          /* Empty Initial Dropzone */
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

      {/* ── Bottom Page Turn Navigator ── */}
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

          {/* Page status indicator with actual page numbers */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              Page <span className="text-white font-black">{currentPage}</span> of{' '}
              <span className="text-indigo-400 font-black">{totalPages}</span>
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
            disabled={!isTeacher || currentPage >= totalPages}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
              !isTeacher || currentPage >= totalPages
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
