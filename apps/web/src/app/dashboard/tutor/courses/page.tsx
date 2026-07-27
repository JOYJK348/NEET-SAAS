'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorCourses } from '@/features/tutor-dashboard/hooks/use-tutor-courses';
import type {
  TutorCourseDto,
  CourseSubjectDto,
  ChapterDto,
  TopicDto,
} from '@/features/tutor-dashboard/types/courses';
import { StatsSkeleton } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  FileText,
  BookMarked,
  GraduationCap,
  Clock,
  BarChart3,
  Layers,
  CheckCircle2,
  Zap,
  AlertCircle,
  Flame,
  Home,
  Eye,
} from 'lucide-react';
import { StudentPreview } from '@/features/course-builder/components/StudentPreview';

type DrillLevel = 'courses' | 'subjects' | 'chapters' | 'topics';

// ─── Subject colour theming ──────────────────────────────────────────────────
const SUBJECT_THEMES: Record<
  string,
  { from: string; to: string; icon: string; light: string; badge: string }
> = {
  physics: {
    from: 'from-indigo-500',
    to: 'to-blue-600',
    icon: 'text-indigo-600',
    light: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  chemistry: {
    from: 'from-emerald-500',
    to: 'to-teal-600',
    icon: 'text-emerald-600',
    light: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  biology: {
    from: 'from-green-500',
    to: 'to-lime-600',
    icon: 'text-green-600',
    light: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },
  maths: {
    from: 'from-rose-500',
    to: 'to-pink-600',
    icon: 'text-rose-600',
    light: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
  },
  english: {
    from: 'from-violet-500',
    to: 'to-purple-600',
    icon: 'text-violet-600',
    light: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
  },
};

const DEFAULT_THEME = {
  from: 'from-slate-500',
  to: 'to-slate-600',
  icon: 'text-slate-600',
  light: 'bg-slate-50',
  badge: 'bg-slate-100 text-slate-700',
};

function getSubjectTheme(name: string) {
  const lower = name.toLowerCase();
  for (const [key, theme] of Object.entries(SUBJECT_THEMES)) {
    if (lower.includes(key)) return theme;
  }
  return DEFAULT_THEME;
}

// ─── Difficulty badge ────────────────────────────────────────────────────────
function DifficultyBadge({ level }: { level: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    EASY: {
      cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    MEDIUM: {
      cls: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: <Flame className="w-3 h-3" />,
    },
    HARD: {
      cls: 'bg-red-100 text-red-700 border border-red-200',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };
  const c = cfg[level] ?? {
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}
    >
      {c.icon} {level}
    </span>
  );
}

// ─── Pill stat ───────────────────────────────────────────────────────────────
function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
      {icon} {label}
    </span>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────
function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1 flex-shrink-0">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
          {c.onClick ? (
            <button
              onClick={c.onClick}
              className="text-xs font-medium text-slate-400 hover:text-violet-600 transition-colors px-1 py-0.5 rounded hover:bg-violet-50"
            >
              {c.label}
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-800 px-1">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, onSelect }: { course: TutorCourseDto; onSelect: () => void }) {
  const totalChapters = course.subjects.reduce((a, s) => a + s.chapters.length, 0);
  const totalTopics = course.subjects.reduce(
    (acc, s) => acc + s.chapters.reduce((sum, ch) => sum + ch.topics.length, 0),
    0,
  );

  const isCourseDeactivated = course.isActive === false;
  const isAllBatchesInactive =
    course.batches.length > 0 && course.batches.every((b) => b.status === 'INACTIVE');
  const isDeactivated = isCourseDeactivated || isAllBatchesInactive;
  const deactivatedBatches = course.batches.filter((b) => b.status === 'INACTIVE').length;

  return (
    <button
      onClick={() => !isDeactivated && onSelect()}
      disabled={isDeactivated}
      className={cn(
        'w-full text-left group active:scale-[0.98] transition-transform duration-100',
        isDeactivated && 'cursor-not-allowed opacity-55 saturate-0 pointer-events-none',
      )}
    >
      <div
        className={cn(
          'bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-200 overflow-hidden',
          isDeactivated ? 'border-red-200' : 'hover:shadow-md hover:border-violet-200',
        )}
      >
        {/* Top accent bar */}
        <div
          className={cn(
            'h-1 bg-gradient-to-r from-violet-500 to-indigo-500',
            isDeactivated && 'from-red-400 to-red-500',
          )}
        />

        <div className="p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                isDeactivated ? 'bg-red-100' : 'bg-gradient-to-br from-violet-100 to-indigo-100',
              )}
            >
              <BookOpen
                className={cn('w-5 h-5', isDeactivated ? 'text-red-400' : 'text-violet-600')}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-sm leading-tight truncate">
                  {course.displayName || course.name}
                </p>
                {isCourseDeactivated && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Course Deactivated
                  </span>
                )}
                {!isCourseDeactivated && isAllBatchesInactive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Batches Inactive
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{course.code}</p>
            </div>
            {!isDeactivated && (
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Description */}
          {course.description && (
            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}

          {/* Deactivation Hint Message */}
          {isDeactivated && (
            <div className="mt-2.5 p-2 rounded bg-red-50/50 border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[10px] font-semibold text-red-700 leading-tight">
                {isCourseDeactivated
                  ? 'This course is currently deactivated.'
                  : 'This course is inactive because all assigned batches are deactivated.'}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-50">
            <Stat
              icon={<Layers className="w-3.5 h-3.5 text-violet-400" />}
              label={`${course.subjects.length} subjects`}
            />
            <Stat
              icon={<FolderOpen className="w-3.5 h-3.5 text-blue-400" />}
              label={`${totalChapters} chapters`}
            />
            <Stat
              icon={<FileText className="w-3.5 h-3.5 text-emerald-400" />}
              label={`${totalTopics} topics`}
            />
            <Stat
              icon={<GraduationCap className="w-3.5 h-3.5 text-amber-400" />}
              label={`${course.batches.length} batches`}
            />
            <Stat
              icon={<Clock className="w-3.5 h-3.5 text-rose-400" />}
              label={`${course.durationMonths}m`}
            />
          </div>

          {/* Inactive course status warning */}
          {isDeactivated && (
            <p className="text-[10px] text-red-500 mt-2.5 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3 h-3" />
              Currently this course is deactivated
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Subject Card ────────────────────────────────────────────────────────────
function SubjectCard({ cs, onSelect }: { cs: CourseSubjectDto; onSelect: () => void }) {
  const theme = getSubjectTheme(cs.subject.name);
  const totalTopics = cs.chapters.reduce((a, ch) => a + ch.topics.length, 0);
  const isDeactivated = cs.isActive === false;

  return (
    <button
      onClick={() => !isDeactivated && onSelect()}
      disabled={isDeactivated}
      className={cn(
        'w-full text-left group active:scale-[0.98] transition-transform duration-100',
        isDeactivated && 'cursor-not-allowed opacity-55 saturate-0 pointer-events-none',
      )}
    >
      <div
        className={cn(
          'bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden',
          isDeactivated ? 'border-red-200' : 'border-slate-100 hover:shadow-md',
        )}
      >
        <div
          className={cn(
            `h-1 bg-gradient-to-r`,
            isDeactivated ? 'from-red-400 to-red-500' : `${theme.from} ${theme.to}`,
          )}
        />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                isDeactivated ? 'bg-red-100' : theme.light,
              )}
            >
              <BookMarked className={cn('w-5 h-5', isDeactivated ? 'text-red-400' : theme.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 text-sm truncate">{cs.subject.name}</p>
                {cs.isMandatory && !isDeactivated && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 flex-shrink-0">
                    ✓ Mandatory
                  </span>
                )}
                {isDeactivated && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Deactivated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{cs.subject.code}</p>
            </div>
            {!isDeactivated && (
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
            )}
          </div>

          {isDeactivated && (
            <div className="mt-2.5 p-2 rounded bg-red-50/50 border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[10px] font-semibold text-red-700 leading-tight">
                This subject is currently deactivated by admin.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-50">
            <Stat
              icon={<FolderOpen className="w-3.5 h-3.5 text-blue-400" />}
              label={`${cs.chapters.length} chapters`}
            />
            <Stat
              icon={<FileText className="w-3.5 h-3.5 text-emerald-400" />}
              label={`${totalTopics} topics`}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Chapter Row ─────────────────────────────────────────────────────────────
function ChapterRow({
  ch,
  index,
  onSelect,
}: {
  ch: ChapterDto;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left group active:scale-[0.99] transition-transform duration-100"
    >
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 p-4">
        <div className="flex items-center gap-3">
          {/* Chapter number badge */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-amber-700">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{ch.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Stat
                icon={<FileText className="w-3 h-3 text-slate-400" />}
                label={`${ch.topics.length} topics`}
              />
              <Stat
                icon={<Clock className="w-3 h-3 text-slate-400" />}
                label={`${ch.plannedHours}h`}
              />
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}

// ─── Topic Card ──────────────────────────────────────────────────────────────
function TopicCard({
  topic,
  index,
  onSelect,
}: {
  topic: TopicDto;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left group active:scale-[0.99] transition-transform duration-100 block"
    >
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          {/* Number */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:from-violet-50 group-hover:to-violet-100 transition-colors">
            <span className="text-[10px] font-black text-emerald-700 group-hover:text-violet-700 transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-violet-700 transition-colors">
                {topic.name}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <DifficultyBadge level={topic.difficultyLevel} />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View content
                </span>
              </div>
            </div>

            {topic.shortName && (
              <p className="text-[11px] text-slate-400 mt-0.5">{topic.shortName}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-slate-50">
              <Stat
                icon={<FileText className="w-3 h-3 text-green-400" />}
                label={`${topic.topicItemCount} items`}
              />
              <Stat
                icon={<Clock className="w-3 h-3 text-blue-400" />}
                label={`${topic.plannedHours}h`}
              />
              <Stat
                icon={<BarChart3 className="w-3 h-3 text-violet-400" />}
                label={`${topic.plannedSessions} sessions`}
              />
            </div>

            {topic.description && (
              <p className="text-[11px] text-slate-400 mt-1.5 italic line-clamp-2 leading-relaxed">
                {topic.description}
              </p>
            )}
          </div>
        </div>

        {/* Learning objectives strip */}
        {topic.learningObjectives && (
          <div className="bg-violet-50 border-t border-violet-100 px-4 py-2 flex items-start gap-2 group-hover:bg-violet-100/50 transition-colors">
            <Zap className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-violet-700 font-medium line-clamp-2">
              {topic.learningObjectives}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Back header ─────────────────────────────────────────────────────────────
function BackHeader({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all flex-shrink-0"
        aria-label="Back"
      >
        <ChevronLeft className="w-4.5 h-4.5 text-slate-600" />
      </button>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 text-base leading-tight truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Count badge ─────────────────────────────────────────────────────────────
function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
      <span className="font-black text-slate-900 text-xs">{count}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ─── Main content ────────────────────────────────────────────────────────────
function TutorCoursesContent() {
  const { courses: data, isLoading, error, refetch } = useTutorCourses();

  const [selectedCourse, setSelectedCourse] = useState<TutorCourseDto | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CourseSubjectDto | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterDto | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicDto | null>(null);

  const level: DrillLevel = !selectedCourse
    ? 'courses'
    : !selectedSubject
      ? 'subjects'
      : !selectedChapter
        ? 'chapters'
        : 'topics';

  const handleBack = () => {
    if (selectedTopic) setSelectedTopic(null);
    else if (level === 'topics') setSelectedChapter(null);
    else if (level === 'chapters') setSelectedSubject(null);
    else if (level === 'subjects') setSelectedCourse(null);
  };

  const breadcrumbs = [
    {
      label: 'Courses',
      onClick:
        level !== 'courses'
          ? () => {
              setSelectedCourse(null);
              setSelectedSubject(null);
              setSelectedChapter(null);
            }
          : undefined,
    },
    ...(selectedCourse
      ? [
          {
            label: selectedCourse.displayName || selectedCourse.name,
            onClick:
              level !== 'subjects'
                ? () => {
                    setSelectedSubject(null);
                    setSelectedChapter(null);
                  }
                : undefined,
          },
        ]
      : []),
    ...(selectedSubject
      ? [
          {
            label: selectedSubject.subject.name,
            onClick: level !== 'chapters' ? () => setSelectedChapter(null) : undefined,
          },
        ]
      : []),
    ...(selectedChapter ? [{ label: selectedChapter.name }] : []),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 min-h-screen bg-slate-50">
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
        <ErrorState
          title="Failed to load courses"
          message={error.message || 'Could not load your courses. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  if (!data || data.courses.length === 0) {
    return (
      <div className="p-4 sm:p-6 min-h-screen bg-slate-50 flex items-center justify-center">
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-slate-300" />}
          title="No courses assigned"
          description="You are not assigned to any courses yet. Courses will appear here once they are linked to your batches."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-6">
        {/* Page title row (only on courses level) */}
        {level === 'courses' && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">My Courses</h1>
              <p className="text-[11px] text-slate-400">Browse syllabus & topics</p>
            </div>
          </div>
        )}

        {/* Breadcrumb (always) */}
        <Breadcrumb crumbs={breadcrumbs} />
      </div>

      {/* ── Content ── */}
      <div className="p-4 sm:p-6 space-y-4 pb-24">
        {/* ── Courses ── */}
        {level === 'courses' && (
          <>
            <div className="flex items-center justify-between">
              <CountBadge count={data.courses.length} label="courses assigned" />
            </div>
            <div className="space-y-3">
              {data.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={() => setSelectedCourse(course)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Subjects ── */}
        {level === 'subjects' && selectedCourse && (
          <>
            <BackHeader
              onBack={handleBack}
              title={selectedCourse.displayName || selectedCourse.name}
              subtitle={`${selectedCourse.code} • ${selectedCourse.durationMonths} months`}
            />
            <div className="flex items-center gap-2">
              <CountBadge count={selectedCourse.subjects.length} label="subjects" />
            </div>
            <div className="space-y-3">
              {selectedCourse.subjects
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((cs) => (
                  <SubjectCard key={cs.id} cs={cs} onSelect={() => setSelectedSubject(cs)} />
                ))}
            </div>
          </>
        )}

        {/* ── Chapters ── */}
        {level === 'chapters' && selectedSubject && (
          <>
            <BackHeader
              onBack={handleBack}
              title={selectedSubject.subject.name}
              subtitle={`${selectedSubject.chapters.length} chapters • ${selectedSubject.chapters.reduce((a, ch) => a + ch.plannedHours, 0)}h total`}
            />
            <div className="flex items-center gap-2">
              <CountBadge count={selectedSubject.chapters.length} label="chapters" />
            </div>

            {selectedSubject.chapters.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-8 w-8 text-slate-300" />}
                title="No chapters yet"
                description="This subject does not have any chapters defined."
              />
            ) : (
              <div className="space-y-2">
                {selectedSubject.chapters
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((ch, i) => (
                    <ChapterRow
                      key={ch.id}
                      ch={ch}
                      index={i}
                      onSelect={() => setSelectedChapter(ch)}
                    />
                  ))}
              </div>
            )}
          </>
        )}

        {/* ── Topics ── */}
        {level === 'topics' && selectedChapter && (
          <>
            <BackHeader
              onBack={handleBack}
              title={selectedChapter.name}
              subtitle={`${selectedChapter.topics.length} topics • ${selectedChapter.plannedHours}h planned`}
            />
            <div className="flex items-center gap-2 flex-wrap gap-y-2">
              <CountBadge count={selectedChapter.topics.length} label="topics" />
              {/* Difficulty distribution */}
              {(['EASY', 'MEDIUM', 'HARD'] as const)
                .map((d) => {
                  const n = selectedChapter.topics.filter((t) => t.difficultyLevel === d).length;
                  if (n === 0) return null;
                  return <DifficultyBadge key={d} level={d} />;
                })
                .map((el, i) => el && <span key={i}>{el}</span>)}
            </div>

            {selectedChapter.topics.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8 text-slate-300" />}
                title="No topics yet"
                description="This chapter does not have any topics defined."
              />
            ) : (
              <div className="space-y-3">
                {selectedChapter.topics
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((topic, i) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      index={i}
                      onSelect={() => setSelectedTopic(topic)}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Topic Content Preview Overlay (View Only Mode) ── */}
      {selectedTopic && selectedCourse && (
        <StudentPreview
          courseName={selectedCourse.displayName || selectedCourse.name}
          selectedTopicId={selectedTopic.id}
          selectedTopicName={selectedTopic.name}
          selectedTopicDescription={selectedTopic.description || null}
          subjects={selectedCourse.subjects}
          onClose={() => setSelectedTopic(null)}
        />
      )}

      {/* ── Bottom navigation hint (mobile) ── */}
      {level !== 'courses' && (
        <div className="fixed bottom-20 left-4 right-4 sm:hidden z-30 pointer-events-none">
          <div className="flex justify-center">
            <button
              onClick={handleBack}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function TutorCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR', 'FACULTY']}>
      <DashboardLayout>
        <TutorCoursesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
