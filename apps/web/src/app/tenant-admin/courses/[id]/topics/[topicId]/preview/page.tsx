'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useTopic } from '@/features/master-data/hooks/use-topics';
import { useTopicItems } from '@/features/course-builder/hooks/use-topic-items';
import { BlockRenderer } from '@/features/course-builder/components/blocks/BlockRenderer';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Loader2,
  Layers,
  Printer,
  CheckCircle2,
} from 'lucide-react';

export default function TopicPreviewPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params?.id as string;
  const topicId = params?.topicId as string;

  const { data: topic, isLoading: topicLoading } = useTopic(topicId);
  const { data: topicItems = [], isLoading: itemsLoading } = useTopicItems(topicId);

  const isLoading = topicLoading || itemsLoading;

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-16 print:p-0 print:m-0 print:max-w-none">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-700 transition-colors mb-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Syllabus
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {topic?.name || 'Topic Content Preview'}
              </h1>
              {topic?.code && (
                <span className="text-xs font-mono font-bold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg border border-violet-200">
                  {topic.code}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500">
              Live interactive preview of all learning materials and content blocks for this topic.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 font-bold text-xs rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50 h-9"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Material 🖨️
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                router.push(`/tenant-admin/courses/${courseId}/builder?topicId=${topicId}`)
              }
              className="gap-1.5 bg-[#7c3aed] hover:bg-violet-700 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Open Course Builder 🚀
            </Button>
          </div>
        </div>

        {/* Topic Banner Metric Summary */}
        <div className="rounded-3xl bg-gradient-to-r from-[#7c3aed] via-violet-700 to-purple-800 p-6 text-white shadow-xl relative overflow-hidden print:bg-none print:text-black print:p-0 print:border-b">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Topic Content Preview
                </span>
                <span className="text-[10px] font-bold text-violet-200">
                  Difficulty: {topic?.difficultyLevel || 'MEDIUM'}
                </span>
              </div>
              <h2 className="text-xl font-bold">{topic?.name}</h2>
              {topic?.description && (
                <p className="text-xs text-violet-200/90 max-w-2xl">{topic.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0 print:hidden">
              <div className="text-center">
                <span className="text-xs text-violet-200 block font-semibold">Total Blocks</span>
                <span className="text-lg font-black text-white">{topicItems.length}</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <span className="text-xs text-violet-200 block font-semibold">Status</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Blocks List */}
        {isLoading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2 animate-pulse bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
            Loading topic content blocks...
          </div>
        ) : topicItems.length === 0 ? (
          <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center font-bold">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Content Blocks Created Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This topic has no learning materials added yet. Click below to open Course Builder and add Key Concepts, Formulas, Worked Examples, Questions, Videos, or PDFs!
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                router.push(`/tenant-admin/courses/${courseId}/builder?topicId=${topicId}`)
              }
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl gap-1.5 h-10 px-5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Open Course Builder 🚀
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center gap-2 text-slate-700">
                <Layers className="w-4 h-4 text-violet-600" /> Content Blocks ({topicItems.length})
              </span>
              <span className="text-[11px] text-violet-600 font-mono">Live Interactive Student View</span>
            </div>

            <div className="space-y-4">
              {topicItems.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden p-1"
                >
                  <BlockRenderer
                    item={item}
                    isEditing={false}
                    onStartEdit={() => {}}
                    onSave={() => {}}
                    onDelete={() => {}}
                    onCancelEdit={() => {}}
                    isSaving={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
