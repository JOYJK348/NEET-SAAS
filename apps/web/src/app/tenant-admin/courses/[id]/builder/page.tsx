'use client';

import { Suspense, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useCourse } from '@/features/master-data/hooks/use-courses';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import { useBuilderState } from '@/features/course-builder/hooks/use-builder-state';
import { BuilderLayout } from '@/features/course-builder/components/BuilderLayout';
import { CourseOutlinePanel } from '@/features/course-builder/components/CourseOutlinePanel';
import { ContentWorkspace } from '@/features/course-builder/components/ContentWorkspace';
import { PropertiesPanel } from '@/features/course-builder/components/PropertiesPanel';

function BuilderPageInner() {
  const params = useParams();
  const courseId = params?.id as string;
  const searchParams = useSearchParams();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: subjects, isLoading: subjectsLoading } = useCourseSubjects(courseId);
  const { selectedTopicId, selection, selectTopic } = useBuilderState(courseId);

  const treeNodes = useMemo(() => {
    return (
      subjects?.map((s: any) => ({
        id: s.id,
        subject: {
          name: s.subject?.name ?? '',
          code: s.subject?.code ?? '',
        },
        chapters:
          s.chapters?.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            displayOrder: ch.displayOrder,
            topics:
              ch.topics?.map((t: any) => ({
                id: t.id,
                name: t.name,
                displayOrder: t.displayOrder,
              })) ?? [],
          })) ?? [],
      })) ?? []
    );
  }, [subjects]);

  const selectedTopicData = useMemo(() => {
    if (!selectedTopicId) return undefined;
    for (const s of subjects ?? []) {
      for (const ch of (s as any).chapters ?? []) {
        for (const t of ch.topics ?? []) {
          if (t.id === selectedTopicId) return t;
        }
      }
    }
    return undefined;
  }, [selectedTopicId, subjects]);

  const handleSave = useCallback((data: any) => {
    console.log('Save:', data);
  }, []);

  if (courseLoading) {
    return (
      <BuilderLayout
        courseId={courseId}
        courseName="Loading..."
        leftPanel={
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-full bg-gray-100 rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-3/4 bg-gray-100 rounded" />
            ))}
          </div>
        }
        centerPanel={
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-gray-400 animate-pulse">Loading...</div>
          </div>
        }
        rightPanel={
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-gray-400 animate-pulse">Loading...</div>
          </div>
        }
      />
    );
  }

  const selectedChapterId = selection.type === 'chapter' ? selection.id : null;
  const selectedTopicItemId = selection.type === 'topic-item' ? selection.id : null;

  const chapterData = useMemo(() => {
    if (!selectedChapterId) return undefined;
    for (const s of subjects ?? []) {
      for (const ch of (s as any).chapters ?? []) {
        if (ch.id === selectedChapterId) return ch;
      }
    }
    return undefined;
  }, [selectedChapterId, subjects]);

  const topicItemSelection = selectedTopicItemId
    ? { type: 'topic-item' as const, id: selectedTopicItemId }
    : null;

  return (
    <BuilderLayout
      courseId={courseId}
      courseName={course?.name ?? 'Untitled Course'}
      courseStatus={(course as any)?.status ?? 'DRAFT'}
      leftPanel={
        <CourseOutlinePanel
          courseId={courseId}
          subjects={treeNodes}
          selectedTopicId={selectedTopicId}
          onSelectTopic={selectTopic}
          loading={subjectsLoading}
        />
      }
      centerPanel={<ContentWorkspace topicId={selectedTopicId} topicData={selectedTopicData} />}
      rightPanel={
        <PropertiesPanel
          selection={
            (topicItemSelection ?? {
              type: selectedTopicId ? 'topic' : null,
              id: selectedTopicId,
            }) as { type: string | null; id: string | null }
          }
          topicData={selectedTopicData ?? chapterData}
          chapterData={chapterData}
          onSave={handleSave}
        />
      }
    />
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-xs text-gray-400 animate-pulse font-semibold">
            Loading builder...
          </div>
        </div>
      }
    >
      <BuilderPageInner />
    </Suspense>
  );
}
