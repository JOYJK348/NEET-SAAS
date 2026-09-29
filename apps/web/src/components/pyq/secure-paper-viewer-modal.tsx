'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  EyeOff,
  AlertTriangle,
  FileText,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface SecurePaperViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subjectName: string;
  year: number;
  fileUrl: string;
  isSolution?: boolean;
}

export function SecurePaperViewerModal({
  isOpen,
  onClose,
  title,
  subjectName,
  year,
  fileUrl,
  isSolution = false,
}: SecurePaperViewerModalProps) {
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [fitMode, setFitMode] = useState<'fit-page' | 'fit-width' | 'custom'>('fit-page');
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const studentIdentifier = useMemoIdentifier(user);
  const currentTimestamp = useMemoTimestamp();

  // Mouse Drag-to-Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if (!scrollAreaRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollAreaRef.current.scrollLeft,
      scrollTop: scrollAreaRef.current.scrollTop,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setFitMode('custom');
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z + 15, 250));
      } else {
        setZoom((z) => Math.max(z - 15, 50));
      }
    }
  };

  // Global mousemove/mouseup while panning so drag continues outside container
  useEffect(() => {
    if (!isPanning) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!scrollAreaRef.current) return;
      e.preventDefault();
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      scrollAreaRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      scrollAreaRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const onGlobalMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [isPanning]);

  // Fullscreen Lockdown Mode with Keyboard Lock API
  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        if ((navigator as any)?.keyboard?.lock) {
          try {
            await (navigator as any).keyboard.lock(['PrintScreen', 'Escape']);
          } catch {}
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        if ((navigator as any)?.keyboard?.unlock) {
          (navigator as any).keyboard.unlock();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  // Load PDF.js engine dynamically
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

  // Blank canvas immediately on blur to ensure zero screenshot capture
  const blankCanvas = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#070E1B';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Render active page onto canvas with full-height/full-width A4 scaling + forensic watermark
  const renderPage = useCallback(
    async (
      pageNum: number,
      currentZoom: number,
      currentRotation: number,
      currentFitMode: 'fit-width' | 'fit-page' | 'custom',
    ) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const validPageNum = Math.max(1, Math.min(pageNum, pdfDocRef.current.numPages || 1));
        const page = await pdfDocRef.current.getPage(validPageNum);
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Auto-orient vertical reading view
        const naturalRotate = page.rotate || 0;
        const finalRotation = (naturalRotate + currentRotation) % 360;

        // Calculate dynamic responsive scale to fit the full A4 page neatly on screen
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation: finalRotation });
        const availableWidth =
          scrollAreaRef.current?.clientWidth ||
          (typeof window !== 'undefined' ? window.innerWidth : 1000);
        const availableHeight =
          scrollAreaRef.current?.clientHeight ||
          (typeof window !== 'undefined' ? window.innerHeight - 110 : 750);

        const paddingX = 40;
        const paddingY = 40;

        // Scale factors
        const scaleW = Math.max((availableWidth - paddingX) / unscaledViewport.width, 0.2);
        const scaleH = Math.max((availableHeight - paddingY) / unscaledViewport.height, 0.2);

        let baseScale = 1.0;
        if (currentFitMode === 'fit-page') {
          // Fit whole A4 paper (height & width) inside screen without cutting off
          baseScale = Math.min(scaleW, scaleH);
        } else if (currentFitMode === 'fit-width') {
          // Fit width comfortably (capped at readable width or container width)
          const targetW = Math.min(availableWidth - paddingX, 900);
          baseScale = targetW / unscaledViewport.width;
        } else {
          // Custom zoom relative to fit-page
          baseScale = Math.min(scaleW, scaleH);
        }

        const fitScale = baseScale * (currentZoom / 100);
        const pixelRatio =
          typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
        const viewport = page.getViewport({ scale: fitScale, rotation: finalRotation });

        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;

        // Draw Forensic DRM Watermark directly onto Canvas 2D Buffer
        try {
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.font = 'bold 16px monospace';
          ctx.fillStyle = '#0F172A';
          ctx.textAlign = 'center';

          const stepX = 280;
          const stepY = 170;
          for (let x = -viewport.width; x < viewport.width * 2; x += stepX) {
            for (let y = -viewport.height; y < viewport.height * 2; y += stepY) {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((-25 * Math.PI) / 180);
              ctx.fillText(studentIdentifier, 0, 0);
              ctx.fillText('NEET CONFIDENTIAL • ' + currentTimestamp, 0, 20);
              ctx.restore();
            }
          }
          ctx.restore();
        } catch {}
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render error:', err);
        }
      }
    },
    [studentIdentifier, currentTimestamp],
  );

  // Load and Parse PDF Document
  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadDoc = async () => {
      try {
        const pdfjs = await getPdfJs();
        if (!pdfjs || isCancelled) return;

        // Clean target URL (remove hash params)
        const cleanUrl = fileUrl.split('#')[0];
        let pdfData: Uint8Array | null = null;

        try {
          const res = await api.getAxiosInstance().get(cleanUrl, {
            responseType: 'arraybuffer',
          });
          if (res.data) {
            pdfData = new Uint8Array(res.data);
          }
        } catch (fetchErr) {
          console.warn('Memory fetch fallback to direct URL parse:', fetchErr);
        }

        const loadingTask = pdfData
          ? pdfjs.getDocument({ data: pdfData })
          : pdfjs.getDocument({ url: cleanUrl, withCredentials: false });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages || 1);
        setCurrentPage(1);
        setJumpPageInput('1');
        setIsLoading(false);

        // Render page 1 in full vertical view
        setTimeout(() => {
          renderPage(1, zoom, rotation, fitMode);
        }, 50);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('PDF Document Load Error:', err);
          setIsLoading(false);
          setLoadError(
            'Unable to render document directly. Please ensure file format is valid PDF.',
          );
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [isOpen, fileUrl, getPdfJs, renderPage, zoom, rotation, fitMode]);

  // Re-render when page, zoom, rotation, fitMode or fullscreen changes
  useEffect(() => {
    if (pdfDocRef.current && !isLoading && !isWindowBlurred && !screenshotDetected) {
      renderPage(currentPage, zoom, rotation, fitMode);
    }
  }, [
    currentPage,
    zoom,
    rotation,
    fitMode,
    isFullscreen,
    isLoading,
    isWindowBlurred,
    screenshotDetected,
    renderPage,
  ]);

  // Window Resize Listener for auto-rescaling
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (pdfDocRef.current && !isLoading) {
        renderPage(currentPage, zoom, rotation, fitMode);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, currentPage, zoom, rotation, fitMode, isLoading, renderPage]);

  // Instant Synchronous Blur / Snipping Tool Detection
  useEffect(() => {
    if (!isOpen) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
      blankCanvas();
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
      renderPage(currentPage, zoom, rotation, fitMode);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        blankCanvas();
      } else if (document.hasFocus()) {
        setIsWindowBlurred(false);
        renderPage(currentPage, zoom, rotation, fitMode);
      }
    };

    // Fast polling loop to catch OS-level screenshot overlays that freeze browser events
    const pollTimer = setInterval(() => {
      if (!document.hasFocus() || document.hidden) {
        setIsWindowBlurred(true);
        blankCanvas();
      }
    }, 150);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, blankCanvas, renderPage, currentPage, zoom, rotation, fitMode]);

  // Anti-Screenshot & Keyboard Shortcuts Blocking
  useEffect(() => {
    if (!isOpen) return;

    const triggerScreenshotAlarm = () => {
      setScreenshotDetected(true);
      blankCanvas();
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText('Screenshots are disabled on protected question papers.');
        }
      } catch {}
      toast.error('Screenshots are strictly disabled for copyrighted exam papers!', {
        id: 'anti-screenshot-toast',
      });
      setTimeout(() => {
        setScreenshotDetected(false);
        if (document.hasFocus()) {
          renderPage(currentPage, zoom, rotation, fitMode);
        }
      }, 2800);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Block PrintScreen / Snapshot key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerScreenshotAlarm();
        return false;
      }

      // 2. Block Save (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toast.error('Downloading this paper is disabled.', { id: 'anti-save-toast' });
        return false;
      }

      // 3. Block Print (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        toast.error('Printing this paper is disabled.', { id: 'anti-print-toast' });
        return false;
      }

      // 4. Block DevTools & Source view
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ['I', 'i', 'C', 'c', 'J', 'j'].includes(e.key)) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }

      // 5. Block Mac Screenshot Combos (Cmd+Shift+3, 4, 5) & Win+Shift+S
      if (
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        (e.shiftKey && (e.key === 'S' || e.key === 's') && (e.metaKey || (e as any).ctrlKey))
      ) {
        e.preventDefault();
        triggerScreenshotAlarm();
        return false;
      }

      // 6. Navigation keys
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => {
          const next = Math.min(p + 1, totalPages);
          setJumpPageInput(String(next));
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => {
          const prev = Math.max(p - 1, 1);
          setJumpPageInput(String(prev));
          return prev;
        });
      } else if (e.key === 'Escape') {
        if (isFullscreen) handleToggleFullscreen();
        else onClose();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerScreenshotAlarm();
        return false;
      }
    };

    const handleBeforePrint = () => {
      setIsWindowBlurred(true);
      blankCanvas();
      toast.error('Printing is strictly prohibited.', { id: 'anti-print-window' });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [
    isOpen,
    isFullscreen,
    onClose,
    totalPages,
    blankCanvas,
    renderPage,
    currentPage,
    zoom,
    rotation,
    fitMode,
  ]);

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-all animate-in fade-in duration-200 select-none">
      {/* Anti-Print Global Style */}
      <style jsx global>{`
        @media print {
          body,
          html,
          * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* Main Secure Modal Container - Full viewport height & width layout */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex flex-col w-screen h-screen bg-[#070E1B] overflow-hidden transition-all duration-200 select-none"
      >
        {/* Custom Protected Header Bar */}
        <div className="h-14 px-3 sm:px-6 bg-[#0B2447] border-b border-[#1E3A8A] flex items-center justify-between text-white shrink-0 z-30 shadow-md">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  {subjectName} &bull; {year}
                </span>
                {isSolution && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Solutions
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  DRM Protected View
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md lg:max-w-lg">
                {title}
              </h2>
            </div>
          </div>

          {/* Clean Custom Reader Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Sizing Presets: Fit Page / Fit Width */}
            <div className="hidden lg:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15">
              <button
                type="button"
                onClick={() => {
                  setFitMode('fit-page');
                  setZoom(100);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer',
                  fitMode === 'fit-page'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10',
                )}
                title="Fit full A4 height on screen"
              >
                Fit Page (A4)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode('fit-width');
                  setZoom(100);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer',
                  fitMode === 'fit-width'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10',
                )}
                title="Expand across full width"
              >
                Fit Width
              </button>
            </div>

            {/* Page Navigation with direct input */}
            <form
              onSubmit={handlePageJump}
              className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-1 border border-white/15"
            >
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => {
                  const prev = Math.max(currentPage - 1, 1);
                  setCurrentPage(prev);
                  setJumpPageInput(String(prev));
                  scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  onBlur={() => setJumpPageInput(String(currentPage))}
                  className="w-8 text-center text-[11px] font-mono font-black bg-white/15 border border-white/20 rounded py-0.5 text-cyan-300 outline-none focus:border-cyan-400"
                  title="Type page number and press Enter"
                />
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  / {totalPages}
                </span>
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => {
                  const next = Math.min(currentPage + 1, totalPages);
                  setCurrentPage(next);
                  setJumpPageInput(String(next));
                  scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 rounded-xl px-1.5 py-1 border border-white/15">
              <button
                type="button"
                onClick={() => {
                  setFitMode('custom');
                  setZoom((z) => Math.max(z - 15, 50));
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode('fit-width');
                  setZoom(100);
                }}
                className="text-[10px] font-mono font-bold px-1 text-slate-300 min-w-[40px] text-center hover:text-cyan-300"
                title="Reset to 100%"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode('custom');
                  setZoom((z) => Math.min(z + 15, 200));
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
                title="Rotate Orientation"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white border border-rose-400/30 transition-all ml-1"
              title="Close Protected Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Protected Vertical Portrait Canvas Reader Area (Full-Height Scrollable Paper Layout) */}
        <div
          ref={scrollAreaRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          className={cn(
            'relative flex-1 bg-[#060D1A] overflow-y-auto overflow-x-auto flex flex-col items-center justify-start p-3 sm:p-6 min-h-0 w-full select-none scroll-smooth',
            isPanning ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Dynamic Forensic Watermark Layer (Overlay) */}
          <div
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-col justify-around opacity-15 select-none"
            aria-hidden="true"
          >
            {Array.from({ length: 24 }).map((_, rIdx) => (
              <div
                key={rIdx}
                className="flex items-center justify-around gap-12 text-white font-mono text-[11px] font-black uppercase tracking-widest whitespace-nowrap transform -rotate-12 select-none"
              >
                <span>{studentIdentifier}</span>
                <span>•</span>
                <span>NEET ACADEMY CONFIDENTIAL</span>
                <span>•</span>
                <span>DO NOT COPY OR RECORD</span>
                <span>•</span>
                <span>{currentTimestamp}</span>
              </div>
            ))}
          </div>

          {/* Screenshot Detection Alarm Overlay */}
          {screenshotDetected && (
            <div className="absolute inset-0 z-40 bg-rose-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-4 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mb-1">
                Screenshot / Capture Blocked 🚫
              </h3>
              <p className="text-xs text-rose-200 max-w-md leading-relaxed font-medium">
                Taking screenshots or screen captures is disabled to protect copyrighted question
                papers and step-by-step solutions.
              </p>
            </div>
          )}

          {/* Privacy Shield Cloak when Window is Unfocused / Lost Focus / Snipping Tool Activated */}
          {isWindowBlurred && (
            <div className="absolute inset-0 z-30 bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-100">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-3">
                <EyeOff className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">
                🛡️ Screen Capture Protection Active
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-medium">
                Content is obscured while window is unfocused or an external application is active.
                Click back inside to continue reading.
              </p>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 space-y-3">
              <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-slate-300 font-mono">
                Decryption & Rendering Page {currentPage}...
              </span>
            </div>
          )}

          {/* Error fallback */}
          {loadError && (
            <div className="p-8 text-center bg-rose-950/40 border border-rose-800/60 rounded-3xl text-rose-200 max-w-md space-y-2 my-auto">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Document Rendering Failed</h4>
              <p className="text-xs text-rose-300">{loadError}</p>
            </div>
          )}

          {/* Vertical Full-Height Portrait A4 Paper Canvas Card */}
          <div
            className={cn(
              'relative shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden bg-white mx-auto my-2 sm:my-4 transition-all duration-100 ring-1 ring-slate-700/60 shrink-0',
              isPanning ? 'cursor-grabbing' : 'cursor-grab',
              (isWindowBlurred || screenshotDetected) &&
                'opacity-0 blur-3xl scale-95 pointer-events-none invisible',
            )}
          >
            <canvas
              ref={canvasRef}
              className="block shadow-2xl select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="h-9 px-4 sm:px-6 bg-[#0B2447] border-t border-[#1E3A8A] flex items-center justify-between text-[11px] text-slate-300 shrink-0 z-30">
          <div className="flex items-center gap-2 text-cyan-300 font-medium truncate">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              Licensed exclusively to{' '}
              <strong className="text-white font-mono">{studentIdentifier}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400 shrink-0">
            <span className="hidden sm:inline">Printing & Downloads Disabled</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">DRM Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function useMemoIdentifier(user: any) {
  return React.useMemo(() => {
    if (!user) return 'NEET-STUDENT-USER';
    return user.email || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id;
  }, [user]);
}

function useMemoTimestamp() {
  const [timestamp, setTimestamp] = useState('');
  useEffect(() => {
    const d = new Date();
    setTimestamp(
      d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  }, []);
  return timestamp;
}
