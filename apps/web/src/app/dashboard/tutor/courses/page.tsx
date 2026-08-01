'use client';

import { useState, useMemo } from 'react';
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
  ChevronDown,
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
  Sparkles,
  Eye,
  Search,
  Filter,
  PlayCircle,
  FileCode,
  Award,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { StudentPreview } from '@/features/course-builder/components/StudentPreview';

// ─── Subject color mapping ────────────────────────────────────────────────────
const SUBJECT_THEMES: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  physics: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', ring: 'ring-blue-200' },
  chemistry: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  biology: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-200' },
  botany: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    ring: 'ring-green-200',
  },
  zoology: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500', ring: 'ring-pink-200' },
};

function getSubjectTheme(name: string) {
  const lower = name.toLowerCase();
  return (
    Object.entries(SUBJECT_THEMES).find(([k]) => lower.includes(k))?.[1] ?? {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      dot: 'bg-violet-500',
      ring: 'ring-violet-200',
    }
  );
}

// ─── Topic Row ────────────────────────────────────────────────────────────────
function TopicRow({
  topic,
  subjectTheme,
  onView,
}: {
  topic: TopicDto;
  subjectTheme: ReturnType<typeof getSubjectTheme>;
  onView?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer',
      )}
    >
      <div className="flex-shrink-0">
        <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-700 font-medium leading-tight">{topic.name}</span>
        {topic.difficultyLevel && (
          <span
            className={cn(
              'ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
              topic.difficultyLevel === 'EASY' && 'bg-emerald-100 text-emerald-600',
              topic.difficultyLevel === 'MEDIUM' && 'bg-amber-100 text-amber-600',
              topic.difficultyLevel === 'HARD' && 'bg-rose-100 text-rose-600',
            )}
          >
            {topic.difficultyLevel}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView?.();
        }}
        className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-full hover:bg-violet-100 transition-colors flex-shrink-0"
      >
        <Eye className="w-3 h-3" /> View
      </button>
    </div>
  );
}

// ─── Chapter Row ──────────────────────────────────────────────────────────────
function ChapterRow({
  chapter,
  subjectTheme,
  defaultOpen = false,
  onViewTopic,
}: {
  chapter: ChapterDto;
  subjectTheme: ReturnType<typeof getSubjectTheme>;
  defaultOpen?: boolean;
  onViewTopic?: (topic: TopicDto) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Chapter header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <span
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500 bg-slate-100',
          )}
        >
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 leading-tight">{chapter.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{chapter.code}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold">
            {chapter.topics.length} topics
          </span>
        </div>
      </button>

      {/* Topics list */}
      {open && (
        <div className="border-t border-slate-50 bg-slate-50/50 py-1">
          {chapter.topics.length === 0 ? (
            <p className="text-[11px] text-slate-300 italic px-5 py-3">No topics yet</p>
          ) : (
            chapter.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                subjectTheme={subjectTheme}
                onView={() => onViewTopic?.(topic)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Section ──────────────────────────────────────────────────────────
function SubjectSection({
  cs,
  onViewTopic,
}: {
  cs: CourseSubjectDto;
  onViewTopic?: (topic: TopicDto) => void;
}) {
  const [open, setOpen] = useState(true);
  const theme = getSubjectTheme(cs.subject.name);

  const totalTopics = cs.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
  const isDeactivated = (cs as any).isActive === false || (cs.subject as any).isActive === false;

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-all',
        isDeactivated ? 'border-slate-200 bg-slate-100/80 opacity-75' : 'border-slate-100',
      )}
    >
      {/* Subject header */}
      <button
        onClick={() => !isDeactivated && setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 transition-colors text-left',
          isDeactivated ? 'bg-slate-200/60 cursor-not-allowed' : theme.bg,
        )}
      >
        <span
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isDeactivated ? 'bg-slate-400' : theme.dot,
          )}
        >
          <BookOpen className="w-4 h-4 text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={cn(
                'text-sm font-black leading-tight',
                isDeactivated ? 'text-slate-700' : theme.text,
              )}
            >
              {cs.subject.name}
            </p>
            {isDeactivated && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 bg-slate-300 text-slate-800 rounded-full border border-slate-400">
                <AlertCircle className="w-3 h-3 text-slate-700" />
                Currently this subject is inactive
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{cs.subject.code}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">{cs.chapters.length} chapters</p>
            <p className="text-[10px] text-slate-400">{totalTopics} topics</p>
          </div>
          {!isDeactivated && (
            <span className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}>
              <ChevronDown className={cn('w-4 h-4', theme.text)} />
            </span>
          )}
        </div>
      </button>

      {/* Chapter list */}
      {open && (
        <div className="p-3 space-y-2 bg-white">
          {cs.chapters.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No chapters available yet</p>
            </div>
          ) : (
            cs.chapters.map((chapter, i) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                subjectTheme={theme}
                defaultOpen={i === 0}
                onViewTopic={onViewTopic}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({
  course,
  onViewTopic,
}: {
  course: TutorCourseDto;
  onViewTopic?: (topic: TopicDto) => void;
}) {
  const totalSubjects = course.subjects.length;
  const totalChapters = course.subjects.reduce((sum, cs) => sum + cs.chapters.length, 0);
  const totalTopics = course.subjects
    .flatMap((cs) => cs.chapters)
    .reduce((sum, ch) => sum + ch.topics.length, 0);

  const isDeactivated = course.isActive === false;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200',
        isDeactivated ? 'border-red-200 opacity-55 saturate-0' : 'border-slate-100',
      )}
    >
      {/* Course header */}
      <div
        className={cn(
          'px-5 py-4 border-b',
          isDeactivated
            ? 'bg-red-50 border-red-100'
            : 'bg-gradient-to-r from-indigo-50 to-violet-50 border-slate-100',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">{course.name}</h3>
              {isDeactivated && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                  <AlertCircle className="w-3 h-3" />
                  Deactivated
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{course.code}</p>
            {course.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500">
                📚 {totalSubjects} subjects
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                📖 {totalChapters} chapters
              </span>
              <span className="text-[10px] font-bold text-slate-500">📝 {totalTopics} topics</span>
              {course.durationMonths && (
                <span className="text-[10px] font-bold text-slate-500">
                  🗓 {course.durationMonths}m duration
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deactivation hint */}
      {isDeactivated && (
        <div className="mx-4 mt-2 p-2 rounded bg-red-50/50 border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-[10px] font-semibold text-red-700 leading-tight">
            This course is currently deactivated by admin.
          </p>
        </div>
      )}

      {/* Subjects tree */}
      <div className="p-4 space-y-3">
        {course.subjects.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No subjects assigned yet</p>
          </div>
        ) : (
          course.subjects.map((cs) => (
            <SubjectSection key={cs.id} cs={cs} onViewTopic={onViewTopic} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function TutorCoursesContent() {
  const { courses: data, isLoading, error, refetch } = useTutorCourses();
  const [selectedTopic, setSelectedTopic] = useState<{
    courseName: string;
    topic: TopicDto;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
        <StatsSkeleton count={3} />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load courses"
          message={error.message || 'Could not load your assigned courses. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  if (!data || data.courses.length === 0) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-slate-300" />}
          title="No courses assigned"
          description="You are not assigned to any course syllabi yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Header Banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Interactive Syllabus Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Curriculum & Course Repository 📚
          </h1>
          <p className="text-xs text-violet-200 font-medium mt-0.5">
            Explore course catalogs, chapter breakdowns, topic items, and preview student view
            lessons.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-violet-100 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl">
            {data.courses.length} Assigned Course{data.courses.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-5">
        {data.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onViewTopic={(topic) => setSelectedTopic({ courseName: course.name, topic })}
          />
        ))}
      </div>

      {/* Topic Content Preview Overlay */}
      {selectedTopic && (
        <StudentPreview
          courseName={selectedTopic.courseName}
          selectedTopicId={selectedTopic.topic.id}
          selectedTopicName={selectedTopic.topic.name}
          selectedTopicDescription={selectedTopic.topic.description || null}
          subjects={[]}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

export default function TutorCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorCoursesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
