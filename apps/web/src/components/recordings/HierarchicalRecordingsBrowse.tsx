'use client';

import { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Video,
  ChevronRight,
  ArrowLeft,
  Search,
  Layers,
} from 'lucide-react';
import { Recording } from './types';
import { RecordingCard } from './RecordingCard';
import { EmptyRecordingsState } from './EmptyRecordingsState';

interface HierarchicalRecordingsBrowseProps {
  recordings: Recording[];
  watchHrefBase?: string;
  allowDelete?: boolean;
  onDelete?: (recording: Recording) => void;
  deletingId?: string | null;
}

export function HierarchicalRecordingsBrowse({
  recordings,
  watchHrefBase = '/dashboard/student/recordings',
  allowDelete = false,
  onDelete,
  deletingId,
}: HierarchicalRecordingsBrowseProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'drilldown' | 'all'>('drilldown');

  const safeRecordings: Recording[] = useMemo(() => {
    let raw: Recording[] = [];
    if (Array.isArray(recordings)) raw = recordings;
    else if (Array.isArray((recordings as any)?.items)) raw = (recordings as any).items;
    else if (Array.isArray((recordings as any)?.data)) raw = (recordings as any).data;

    // Filter out incomplete placeholder cards if a READY recording exists
    const readyLiveClassIds = new Set<string>();
    for (const rec of raw) {
      const liveClassId = rec.liveClassId || rec.liveClass?.id;
      if (liveClassId && (rec.status === 'READY' || rec.status === 'COMPLETED')) {
        readyLiveClassIds.add(liveClassId);
      }
    }

    const result: Recording[] = [];
    for (const rec of raw) {
      const liveClassId = rec.liveClassId || rec.liveClass?.id;
      if (
        liveClassId &&
        readyLiveClassIds.has(liveClassId) &&
        rec.status !== 'READY' &&
        rec.status !== 'COMPLETED'
      ) {
        continue; // Hide incomplete placeholder card if a READY recording exists
      }
      result.push(rec);
    }

    return result;
  }, [recordings]);

  // ── Global Search Filter ──────────────────────────────────────────────────
  const searchFilteredRecordings = useMemo(() => {
    if (!searchQuery.trim()) return safeRecordings;
    const q = searchQuery.toLowerCase();
    return safeRecordings.filter((rec) => {
      const title = String(rec.liveClass?.title || '').toLowerCase();
      const subtitle = String(rec.liveClass?.subtitle || '').toLowerCase();
      const description = String(rec.liveClass?.description || '').toLowerCase();
      const topic = String(rec.display?.topicName || '').toLowerCase();
      const tutor = String(rec.display?.tutorName || '').toLowerCase();
      const course = String(rec.display?.courseName || '').toLowerCase();
      const batch = String(rec.display?.batchName || '').toLowerCase();
      const subject = String(rec.display?.subjectName || '').toLowerCase();
      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        description.includes(q) ||
        topic.includes(q) ||
        tutor.includes(q) ||
        course.includes(q) ||
        batch.includes(q) ||
        subject.includes(q)
      );
    });
  }, [safeRecordings, searchQuery]);

  // ── Group by Courses (Level 1) ────────────────────────────────────────────
  const coursesList = useMemo(() => {
    const map = new Map<string, { name: string; count: number; batches: Set<string> }>();
    searchFilteredRecordings.forEach((rec) => {
      const cName = rec.display?.courseName || 'NEET Crash Course 2027';
      const bName = rec.display?.batchName || 'NEET Crash Course 2027-Batch B';
      if (!map.has(cName)) {
        map.set(cName, { name: cName, count: 0, batches: new Set() });
      }
      const item = map.get(cName)!;
      item.count += 1;
      item.batches.add(bName);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [searchFilteredRecordings]);

  // ── Group by Batches (Level 2) ────────────────────────────────────────────
  const batchesList = useMemo(() => {
    if (!selectedCourse) return [];
    const map = new Map<string, { name: string; count: number; subjects: Set<string> }>();
    searchFilteredRecordings.forEach((rec) => {
      const cName = rec.display?.courseName || 'NEET Crash Course 2027';
      if (cName.toLowerCase() === selectedCourse.toLowerCase()) {
        const bName = rec.display?.batchName || 'NEET Crash Course 2027-Batch B';
        const sName = rec.display?.subjectName || 'Physics';
        if (!map.has(bName)) {
          map.set(bName, { name: bName, count: 0, subjects: new Set() });
        }
        const item = map.get(bName)!;
        item.count += 1;
        item.subjects.add(sName);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [searchFilteredRecordings, selectedCourse]);

  // ── Group by Subjects (Level 3) ───────────────────────────────────────────
  const subjectsList = useMemo(() => {
    if (!selectedCourse || !selectedBatch) return [];
    const map = new Map<string, { name: string; count: number }>();
    searchFilteredRecordings.forEach((rec) => {
      const cName = rec.display?.courseName || 'NEET Crash Course 2027';
      const bName = rec.display?.batchName || 'NEET Crash Course 2027-Batch B';
      if (
        cName.toLowerCase() === selectedCourse.toLowerCase() &&
        bName.toLowerCase() === selectedBatch.toLowerCase()
      ) {
        const sName = rec.display?.subjectName || 'Physics';
        if (!map.has(sName)) {
          map.set(sName, { name: sName, count: 0 });
        }
        map.get(sName)!.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [searchFilteredRecordings, selectedCourse, selectedBatch]);

  // ── Filtered Video Cards for Level 4 ──────────────────────────────────────
  const finalVideoCards = useMemo(() => {
    if (!selectedCourse || !selectedBatch || !selectedSubject) return [];
    return searchFilteredRecordings.filter((rec) => {
      const cName = (rec.display?.courseName || 'NEET Crash Course 2027').toLowerCase();
      const bName = (rec.display?.batchName || 'NEET Crash Course 2027-Batch B').toLowerCase();
      const sName = (rec.display?.subjectName || 'Physics').toLowerCase();
      return (
        cName === selectedCourse.toLowerCase() &&
        bName === selectedBatch.toLowerCase() &&
        sName === selectedSubject.toLowerCase()
      );
    });
  }, [searchFilteredRecordings, selectedCourse, selectedBatch, selectedSubject]);

  // Handle Breadcrumb Reset / Back Action
  const resetToCourses = () => {
    setSelectedCourse(null);
    setSelectedBatch(null);
    setSelectedSubject(null);
  };

  const resetToBatches = () => {
    setSelectedBatch(null);
    setSelectedSubject(null);
  };

  const resetToSubjects = () => {
    setSelectedSubject(null);
  };

  // Determine current active drilldown level
  const currentLevel = useMemo(() => {
    if (!selectedCourse) return 'course';
    if (!selectedBatch) return 'batch';
    if (!selectedSubject) return 'subject';
    return 'recordings';
  }, [selectedCourse, selectedBatch, selectedSubject]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {viewMode === 'drilldown' && currentLevel !== 'course' && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentLevel === 'batch') resetToCourses();
              else if (currentLevel === 'subject') resetToBatches();
              else if (currentLevel === 'recordings') resetToSubjects();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>
              Back to{' '}
              {currentLevel === 'batch'
                ? 'All Courses'
                : currentLevel === 'subject'
                  ? 'Batches'
                  : 'Subjects'}
            </span>
          </button>
        </div>
      )}

      {/* Search & Mode Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by class title, topic, tutor name, course, batch or subject..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-bold focus:bg-white focus:outline-none focus:border-[#0052CC] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('drilldown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'drilldown'
                ? 'bg-[#0052CC] text-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0B2447]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Category Cards
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-[#0052CC] text-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0B2447]'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> All Videos ({searchFilteredRecordings.length})
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumbs */}
      {viewMode === 'drilldown' && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs scrollbar-none whitespace-nowrap">
          <button
            onClick={resetToCourses}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer ${
              currentLevel === 'course'
                ? 'bg-blue-100 text-[#0052CC] font-extrabold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#0052CC]" /> All Courses
          </button>

          {selectedCourse && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={resetToBatches}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer ${
                  currentLevel === 'batch'
                    ? 'bg-blue-100 text-[#0052CC] font-extrabold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#0052CC]" /> {selectedCourse}
              </button>
            </>
          )}

          {selectedBatch && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={resetToSubjects}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer ${
                  currentLevel === 'subject'
                    ? 'bg-blue-100 text-[#0052CC] font-extrabold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0052CC]" /> {selectedBatch}
              </button>
            </>
          )}

          {selectedSubject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-[#0052CC] font-extrabold border border-blue-200 shrink-0">
                <Video className="w-3.5 h-3.5 text-[#0052CC]" /> {selectedSubject} Recordings
              </span>
            </>
          )}
        </div>
      )}

      {/* View Mode 1: All Videos Grid */}
      {viewMode === 'all' ? (
        searchFilteredRecordings.length === 0 ? (
          <EmptyRecordingsState
            hasFilters={Boolean(searchQuery)}
            onReset={() => setSearchQuery('')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchFilteredRecordings.map((rec) => (
              <RecordingCard
                key={rec.id}
                recording={rec}
                onDelete={allowDelete ? onDelete : undefined}
                deleting={deletingId === rec.id}
                watchHref={`${watchHrefBase}/${rec.id}`}
              />
            ))}
          </div>
        )
      ) : (
        /* View Mode 2: Hierarchical 4-Tier Cards Flow */
        <>
          {/* LEVEL 1: COURSES CARDS */}
          {currentLevel === 'course' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#0052CC] shrink-0" /> Select a Course
                </h2>
                <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0">
                  {coursesList.length} Available Course{coursesList.length === 1 ? '' : 's'}
                </span>
              </div>

              {coursesList.length === 0 ? (
                <EmptyRecordingsState
                  hasFilters={Boolean(searchQuery)}
                  onReset={() => setSearchQuery('')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coursesList.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCourse(c.name)}
                      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer"
                    >
                      <div className="space-y-3 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white transition-all duration-200">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0052CC]">
                            Course
                          </span>
                          <h3 className="text-base font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors leading-snug">
                            {c.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Video className="w-3.5 h-3.5 text-[#0052CC]" />
                          <strong className="text-[#0B2447]">{c.count}</strong> Recorded Class
                          {c.count === 1 ? '' : 'es'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#0052CC] font-extrabold group-hover:translate-x-1 transition-transform">
                          View Batches <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: BATCHES CARDS */}
          {currentLevel === 'batch' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={resetToCourses}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0052CC] hover:border-blue-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    title="Back to Courses"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#0052CC] uppercase tracking-wider block truncate">
                      {selectedCourse}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2 truncate">
                      <Users className="w-5 h-5 text-[#0052CC] shrink-0" /> Select a Batch
                    </h2>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0">
                  {batchesList.length} Batch{batchesList.length === 1 ? '' : 'es'}
                </span>
              </div>

              {batchesList.length === 0 ? (
                <EmptyRecordingsState
                  hasFilters={Boolean(searchQuery)}
                  onReset={() => setSearchQuery('')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batchesList.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => setSelectedBatch(b.name)}
                      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer"
                    >
                      <div className="space-y-3 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white transition-all duration-200">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0052CC]">
                            Batch
                          </span>
                          <h3 className="text-base font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors leading-snug">
                            {b.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Video className="w-3.5 h-3.5 text-[#0052CC]" />
                          <strong className="text-[#0B2447]">{b.count}</strong> Recorded Class
                          {b.count === 1 ? '' : 'es'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#0052CC] font-extrabold group-hover:translate-x-1 transition-transform">
                          View Subjects <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: SUBJECTS CARDS */}
          {currentLevel === 'subject' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={resetToBatches}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0052CC] hover:border-blue-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    title="Back to Batches"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#0052CC] uppercase tracking-wider block truncate">
                      {selectedCourse} • {selectedBatch}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2 truncate">
                      <BookOpen className="w-5 h-5 text-[#0052CC] shrink-0" /> Select a Subject
                    </h2>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0">
                  {subjectsList.length} Subject{subjectsList.length === 1 ? '' : 's'}
                </span>
              </div>

              {subjectsList.length === 0 ? (
                <EmptyRecordingsState
                  hasFilters={Boolean(searchQuery)}
                  onReset={() => setSearchQuery('')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectsList.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setSelectedSubject(s.name)}
                      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer"
                    >
                      <div className="space-y-3 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white transition-all duration-200">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0052CC]">
                            Subject
                          </span>
                          <h3 className="text-base font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors leading-snug">
                            {s.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Video className="w-3.5 h-3.5 text-[#0052CC]" />
                          <strong className="text-[#0B2447]">{s.count}</strong> Recorded Video
                          {s.count === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#0052CC] font-extrabold group-hover:translate-x-1 transition-transform">
                          Watch Videos <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 4: RECORDING VIDEO CARDS */}
          {currentLevel === 'recordings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={resetToSubjects}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0052CC] hover:border-blue-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    title="Back to Subjects"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#0052CC] uppercase tracking-wider block truncate">
                      {selectedCourse} • {selectedBatch} • {selectedSubject}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2 truncate">
                      <Video className="w-5 h-5 text-emerald-600 shrink-0" /> {selectedSubject}{' '}
                      Recordings
                    </h2>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0">
                  {finalVideoCards.length} Video{finalVideoCards.length === 1 ? '' : 's'}
                </span>
              </div>

              {finalVideoCards.length === 0 ? (
                <EmptyRecordingsState
                  hasFilters={Boolean(searchQuery)}
                  onReset={() => setSearchQuery('')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finalVideoCards.map((rec) => (
                    <RecordingCard
                      key={rec.id}
                      recording={rec}
                      onDelete={allowDelete ? onDelete : undefined}
                      deleting={deletingId === rec.id}
                      watchHref={`${watchHrefBase}/${rec.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
