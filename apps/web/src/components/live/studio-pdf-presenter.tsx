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
  Layers,
} from 'lucide-react';

export interface PdfDocumentInfo {
  id: string;
  name: string;
  url: string;
  category: string;
  totalPages: number;
}

export const SAMPLE_NEET_DOCUMENTS: PdfDocumentInfo[] = [
  {
    id: 'neet-bio-2024',
    name: 'NEET 2024 Biology - High Yield Q&A with Diagrams',
    category: 'Biology',
    totalPages: 24,
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 'neet-phys-mechanics',
    name: 'NEET Physics - Mechanics & Formula Cheat Sheet',
    category: 'Physics',
    totalPages: 16,
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 'neet-chem-organic',
    name: 'NEET Chemistry - Named Reactions & Practice Problems',
    category: 'Chemistry',
    totalPages: 18,
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
  const [selectedDoc, setSelectedDoc] = useState<PdfDocumentInfo>(
    propDoc || SAMPLE_NEET_DOCUMENTS[0]
  );
  const [currentPage, setCurrentPage] = useState<number>(propPage);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(!propDoc && isTeacher);
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
    if (currentPage < selectedDoc.totalPages) {
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

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const customDoc: PdfDocumentInfo = {
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.pdf$/i, ''),
      url: objectUrl,
      category: 'Uploaded Document',
      totalPages: 20, // default estimation
    };

    handleSelectDocument(customDoc);
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
                {selectedDoc.name}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold shrink-0 hidden sm:inline">
                {selectedDoc.category}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {isTeacher
                ? 'Presenter Controls (Page synched to all students)'
                : 'Synced Live Presentation'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isTeacher && (
            <>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Choose NEET Question Paper / Note PDF"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Change PDF</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Upload PDF from device"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCustomUpload}
              />
            </>
          )}

          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(75, z - 15))}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-slate-300">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 15))}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

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
              title="Exit PDF Presentation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Document Picker Modal (Dropdown overlay) ── */}
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
              const isSelected = selectedDoc.id === doc.id;
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
                    <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{doc.name}</p>
                      <span className="text-[10px] text-slate-400">{doc.category} • {doc.totalPages} Pages</span>
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
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-dashed border-indigo-500/40 hover:border-indigo-500 text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Custom PDF from Device
            </button>
          </div>
        </div>
      )}

      {/* ── Main Presentation Canvas Stage ── */}
      <div className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 w-full max-w-3xl aspect-[1/1.35] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col text-slate-900 relative"
        >
          {/* Simulated High-Res Educational Document Rendering */}
          <div className="h-10 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 text-slate-600 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{selectedDoc.name}</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Page {currentPage} of {selectedDoc.totalPages}
            </span>
          </div>

          {/* Document Content Canvas View */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto font-serif select-text">
            <div>
              <div className="border-b border-slate-200 pb-3 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 font-black">
                  {selectedDoc.category} — Chapter Review & Question Analysis
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Topic Section {currentPage}: Key High-Yield Principles for NEET UG
                </h2>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
                  <span className="text-xs font-black text-indigo-800 uppercase block mb-1">
                    🎯 Master Concept Checklist:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Core foundational definitions, diagrams, and derivation summaries.</li>
                    <li>Frequently tested NEET question patterns & previous 10-year trends.</li>
                    <li>Speed tricks & eliminate-the-wrong-options methods for time efficiency.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">Problem Set {currentPage}.1:</p>
                  <p className="italic text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    &quot;Identify the correct thermodynamic/biological reaction sequence corresponding to the highest standard enthalpy / cellular respiration yield under standard conditions.&quot;
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50/40 transition">
                    (A) Stage I Exothermic pathway with net ATP yield = 36
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50/40 transition">
                    (B) Stage II Substrate-level phosphorylation sequence
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50/40 transition">
                    (C) Coupled redox phosphorylation with cytochrome c
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50/40 transition">
                    (D) Anaerobic reduction pathway under critical flux
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span>NEET Platform Live Studio • Authorized Teaching Material</span>
              <span>Page {currentPage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Presentation Page Navigator ── */}
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
            Page <span className="text-white font-black">{currentPage}</span> / {selectedDoc.totalPages}
          </span>
          {!isTeacher && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced
            </span>
          )}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= selectedDoc.totalPages || !isTeacher}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
            currentPage >= selectedDoc.totalPages || !isTeacher
              ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer active:scale-95'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
