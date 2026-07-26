'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentCourses } from '@/features/student-dashboard/hooks/use-student-courses';
import type {
  StudentCourseDto,
  CourseSubjectDto,
  ChapterDto,
  TopicItemCountDto,
} from '@/features/student-dashboard/types/student-dashboard.types';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CoursesSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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
}: {
  topic: TopicItemCountDto;
  subjectTheme: ReturnType<typeof getSubjectTheme>;
}) {
  const hasContent = topic.publishedItemCount > 0;
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
        hasContent ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-50',
      )}
    >
      <div className="flex-shrink-0">
        {hasContent ? (
          <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <Lock className="w-3 h-3 text-slate-300" />
        )}
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
      {topic.publishedItemCount > 0 && (
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full',
            subjectTheme.bg,
            subjectTheme.text,
          )}
        >
          {topic.publishedItemCount} items
        </span>
      )}
    </div>
  );
}

// ─── Chapter Row ──────────────────────────────────────────────────────────────
function ChapterRow({
  chapter,
  subjectTheme,
  defaultOpen = false,
}: {
  chapter: ChapterDto;
  subjectTheme: ReturnType<typeof getSubjectTheme>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalItems = chapter.topics.reduce((sum, t) => sum + t.publishedItemCount, 0);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Chapter header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <span
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500',
            'bg-slate-100',
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
          {totalItems > 0 && (
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                subjectTheme.bg,
                subjectTheme.text,
              )}
            >
              {totalItems} items
            </span>
          )}
        </div>
      </button>

      {/* Topics list */}
      {open && (
        <div className="border-t border-slate-50 bg-slate-50/50 py-1">
          {chapter.topics.length === 0 ? (
            <p className="text-[11px] text-slate-300 italic px-5 py-3">No topics yet</p>
          ) : (
            chapter.topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} subjectTheme={subjectTheme} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Section ──────────────────────────────────────────────────────────
function SubjectSection({ cs }: { cs: CourseSubjectDto }) {
  const [open, setOpen] = useState(true);
  const theme = getSubjectTheme(cs.subject.name);

  const totalTopics = cs.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
  const totalItems = cs.chapters
    .flatMap((ch) => ch.topics)
    .reduce((sum, t) => sum + t.publishedItemCount, 0);

  return (
    <div className={cn('rounded-2xl border border-slate-100 overflow-hidden')}>
      {/* Subject header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 transition-colors text-left',
          theme.bg,
        )}
      >
        <span
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            theme.dot,
          )}
        >
          <BookOpen className="w-4 h-4 text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-black leading-tight', theme.text)}>{cs.subject.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{cs.subject.code}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700">{cs.chapters.length} chapters</p>
            <p className="text-[10px] text-slate-400">
              {totalTopics} topics • {totalItems} items
            </p>
          </div>
          <span className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}>
            <ChevronDown className={cn('w-4 h-4', theme.text)} />
          </span>
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
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course }: { course: StudentCourseDto }) {
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
          course.subjects.map((cs) => <SubjectSection key={cs.id} cs={cs} />)
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function CoursesContent() {
  const { courses, isLoading, error, refetch } = useStudentCourses();

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-black text-slate-900">My Courses</h1>
          <p className="text-xs text-slate-400">Syllabus & study material</p>
        </div>
        {courses && courses.courses.length > 0 && (
          <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
            {courses.courses.length} course{courses.courses.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <CoursesSkeleton />
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load courses</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-bold text-violet-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : !courses || courses.courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No courses found</p>
          <p className="text-xs text-slate-400 mt-1">
            Courses appear once your batch has an assigned course
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {courses.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StudentCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <CoursesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
