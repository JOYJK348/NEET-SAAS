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
  const {
    data: subjects,
    isLoading: subjectsLoading,
    refetch: refetchSubjects,
  } = useCourseSubjects(courseId);
  const { selectedTopicId, selection, selectTopic, clearSelection, selectEntity } =
    useBuilderState(courseId);

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
            courseSubjectId: s.id,
            topics:
              ch.topics?.map((t: any) => ({
                id: t.id,
                name: t.name,
                displayOrder: t.displayOrder,
                chapterId: ch.id,
                _count: t._count,
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

  const selectedTopicName = selectedTopicData?.name ?? null;
  const selectedTopicDescription = selectedTopicData?.description ?? null;

  const handleRefresh = useCallback(() => {
    refetchSubjects();
  }, [refetchSubjects]);

  const selectedChapterId = selection.type === 'chapter' ? selection.id : null;
  const selectedTopicItemId = selection.type === 'topic-item' ? selection.id : null;

  const chapterData = useMemo(() => {
    if (!selectedChapterId) return undefined;
    for (const s of subjects ?? []) {
      for (const _ch of (s as any).chapters ?? []) {
        if (_ch.id === selectedChapterId) return _ch;
      }
    }
    return undefined;
  }, [selectedChapterId, subjects]);

  const topicItemSelection = selectedTopicItemId
    ? { type: 'topic-item' as const, id: selectedTopicItemId }
    : null;

  if (courseLoading) {
    return (
      <BuilderLayout
        courseId={courseId}
        course={null}
        subjects={[]}
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

  return (
    <BuilderLayout
      courseId={courseId}
      course={course}
      subjects={subjects}
      selectedTopicId={selectedTopicId}
      selectedTopicName={selectedTopicName}
      selectedTopicDescription={selectedTopicDescription}
      leftPanel={
        <CourseOutlinePanel
          courseId={courseId}
          subjects={treeNodes}
          selectedTopicId={selectedTopicId}
          onSelectTopic={selectTopic}
          onRefresh={handleRefresh}
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
