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
  ChevronDown,
  Layers,
  CheckCircle2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { StudentPreview } from '@/features/course-builder/components/StudentPreview';

// ─── Topic Row with Connected Tree Line ──────────────────────────────────────

function TopicRow({
  topic,
  onView,
}: {
  topic: TopicDto;
  onView?: () => void;
}) {
  return (
    <div className="relative flex items-start gap-3.5 pl-6 py-2.5 group">
      {/* Connected Tree Line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-slate-200 group-last:bottom-1/2" />
      <div className="absolute left-2 top-3.5 w-1.5 h-1.5 rounded-full bg-violet-400" />

      {/* Circular Check Icon */}
      <div className="p-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200/60 shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-black text-slate-900 leading-tight">
            {topic.name}
          </h5>
          <button
            type="button"
            onClick={onView}
            className="px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] border border-violet-200/60 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>
        {topic.description && (
          <p className="text-[11px] font-medium text-slate-500 leading-normal mt-0.5">
            {topic.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Chapter Accordion Row ───────────────────────────────────────────────────

function ChapterRow({
  chapter,
  defaultOpen = true,
  onViewTopic,
}: {
  chapter: ChapterDto;
  defaultOpen?: boolean;
  onViewTopic?: (topic: TopicDto) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
      {/* Chapter Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate leading-snug">
              {chapter.name}
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400">{chapter.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-500">
            {chapter.topics.length} topics
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Topics connected tree list */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/40 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Topics</span>
          </div>

          {chapter.topics.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-4 py-2">No topics available yet</p>
          ) : (
            <div className="relative pl-1">
              {chapter.topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} onView={() => onViewTopic?.(topic)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Collapsible Section ─────────────────────────────────────────────

function SubjectSection({
  cs,
  onViewTopic,
}: {
  cs: CourseSubjectDto;
  onViewTopic?: (topic: TopicDto) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalTopics = cs.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);

  return (
    <div className="rounded-3xl border border-emerald-200/70 bg-white overflow-hidden shadow-2xs">
      {/* Subject Header (Light Emerald pill matching screenshot) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-emerald-50/80 hover:bg-emerald-100/60 transition-colors text-left border-b border-emerald-100"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-emerald-950 truncate">{cs.subject.name}</h3>
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              {cs.subject.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-extrabold text-emerald-900">
              {cs.chapters.length} chapters
            </p>
            <p className="text-[10px] font-bold text-emerald-700">{totalTopics} topics</p>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 text-emerald-700 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Chapters list */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Chapters</span>
          </div>

          {cs.chapters.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">
              No chapters assigned yet.
            </div>
          ) : (
            cs.chapters.map((ch, idx) => (
              <ChapterRow
                key={ch.id}
                chapter={ch}
                defaultOpen={idx === 0}
                onViewTopic={onViewTopic}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card Component ───────────────────────────────────────────────────

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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Top Course Info */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Layers className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {course.name}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-400">{course.code}</p>

          <div className="flex items-center gap-3.5 mt-2.5 flex-wrap text-xs font-bold text-slate-600">
            <span>📚 {totalSubjects} subjects</span>
            <span>📖 {totalChapters} chapters</span>
            <span>📝 {totalTopics} topics</span>
            {course.durationMonths && <span>⏱️ {course.durationMonths}m duration</span>}
          </div>
        </div>
      </div>

      {/* Subjects Tree */}
      <div className="space-y-4 pt-2">
        {course.subjects.map((cs) => (
          <SubjectSection key={cs.id} cs={cs} onViewTopic={onViewTopic} />
        ))}
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* Top Page Title */}
      <div className="text-center my-3 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          MY COURSES
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Assigned curriculum repositories & chapter breakdowns
        </p>
      </div>



      {/* Courses List */}
      <div className="space-y-6 max-w-7xl mx-auto">
        {data.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onViewTopic={(topic) => setSelectedTopic({ courseName: course.name, topic })}
          />
        ))}
      </div>

      {/* Student View Topic Overlay Preview */}
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

// ─── Page Export ────────────────────────────────────────────────────────────

export default function TutorCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorCoursesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
