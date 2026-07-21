'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  MoreVertical,
  Plus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Folder,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubjectNode {
  id: string;
  subject: { name: string; code: string };
  chapters: Array<{
    id: string;
    name: string;
    displayOrder: number;
    topics: Array<{
      id: string;
      name: string;
      displayOrder: number;
      _count?: { topicItems?: number };
    }>;
  }>;
}

interface CourseOutlinePanelProps {
  courseId: string;
  subjects: SubjectNode[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  loading?: boolean;
}

export function CourseOutlinePanel({
  courseId: _courseId,
  subjects,
  selectedTopicId,
  onSelectTopic,
  loading,
}: CourseOutlinePanelProps) {
  const [search, setSearch] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => {
    return new Set(subjects.map((s) => s.id));
  });
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects
      .map((s) => {
        const matchSubject =
          s.subject.name.toLowerCase().includes(q) || s.subject.code.toLowerCase().includes(q);
        const chapters = s.chapters
          .map((ch) => {
            const matchChapter = ch.name.toLowerCase().includes(q);
            const topics = ch.topics.filter((t) => t.name.toLowerCase().includes(q));
            if (matchChapter) return ch;
            if (topics.length > 0) return { ...ch, topics };
            return null;
          })
          .filter(Boolean) as SubjectNode['chapters'];
        if (matchSubject) return s;
        if (chapters.length > 0) return { ...s, chapters };
        return null;
      })
      .filter(Boolean) as SubjectNode[];
  }, [subjects, search]);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-full bg-gray-100 rounded-xl animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 pl-3">
            <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-50 rounded ml-4 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
            Course Outline
          </span>
          <span className="text-[10px] font-bold text-gray-400 tabular-nums">
            {subjects.length} subjects
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter outline..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-gray-100 border border-transparent focus:border-violet-600/30 focus:bg-white focus:ring-2 focus:ring-violet-600/10 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">
              {search ? 'No matches found' : 'No subjects yet'}
            </p>
            <p className="text-[10px] text-gray-400">
              {search ? 'Try a different search term' : 'Add subjects to get started'}
            </p>
          </div>
        ) : (
          filtered.map((subject) => {
            const isSubjectOpen = expandedSubjects.has(subject.id);
            return (
              <div key={subject.id}>
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className={cn(
                    'group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all',
                    isSubjectOpen
                      ? 'bg-violet-100/60 text-violet-900'
                      : 'text-gray-700 hover:bg-violet-50/60',
                  )}
                >
                  <div className="flex items-center justify-center w-5 h-5 shrink-0">
                    {isSubjectOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-violet-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span className="text-xs font-bold truncate flex-1">{subject.subject.name}</span>
                  <span className="text-[9px] font-mono font-semibold text-gray-400 uppercase shrink-0">
                    {subject.subject.code}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </button>

                {isSubjectOpen && (
                  <div className="ml-2 pl-3 border-l-2 border-violet-100 space-y-0.5">
                    {subject.chapters.length === 0 && (
                      <p className="text-[10px] text-gray-400 italic py-2 pl-3">No chapters</p>
                    )}
                    {subject.chapters.map((chapter) => {
                      const isChapterOpen = expandedChapters.has(chapter.id);
                      return (
                        <div key={chapter.id}>
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="group flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-left transition-all text-gray-600 hover:bg-violet-50/60"
                          >
                            <div className="flex items-center justify-center w-4 h-4 shrink-0">
                              {isChapterOpen ? (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                            <Folder className="h-3 w-3 shrink-0 text-amber-500" />
                            <span className="text-[11px] font-semibold truncate flex-1">
                              {chapter.name}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-3 w-3 text-gray-400" />
                            </span>
                          </button>

                          {isChapterOpen && (
                            <div className="ml-4 space-y-0.5">
                              {chapter.topics.length === 0 && (
                                <p className="text-[10px] text-gray-400 italic py-1.5 pl-3">
                                  No topics
                                </p>
                              )}
                              {chapter.topics.map((topic) => {
                                const isSelected = selectedTopicId === topic.id;
                                const itemCount = topic._count?.topicItems ?? 0;
                                return (
                                  <button
                                    key={topic.id}
                                    onClick={() => onSelectTopic(topic.id)}
                                    className={cn(
                                      'group flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-left transition-all',
                                      isSelected
                                        ? 'bg-violet-600 text-white rounded-r-xl'
                                        : 'text-gray-600 hover:bg-violet-50 rounded-r-xl',
                                    )}
                                  >
                                    <FileText className="h-3 w-3 shrink-0" />
                                    <span
                                      className={cn(
                                        'text-[11px] font-medium truncate flex-1',
                                        isSelected && 'font-semibold',
                                      )}
                                    >
                                      {topic.name}
                                    </span>
                                    {itemCount > 0 && (
                                      <span
                                        className={cn(
                                          'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0',
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-violet-100',
                                        )}
                                      >
                                        {itemCount}
                                      </span>
                                    )}
                                    <span
                                      className={cn(
                                        'opacity-0 group-hover:opacity-100 transition-opacity',
                                        isSelected && 'text-white/70',
                                      )}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          disabled
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border-2 border-dashed border-violet-200 text-violet-400 text-xs font-bold cursor-not-allowed hover:border-violet-300 hover:text-violet-500 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Subject
        </button>
      </div>
    </div>
  );
}
