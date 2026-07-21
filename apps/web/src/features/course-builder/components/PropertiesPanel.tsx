'use client';

import { useState } from 'react';
import { Save, Layers, FileText, ClipboardList, Info, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  selection: { type: string | null; id: string | null };
  topicData?: any;
  chapterData?: any;
  onSave?: (data: any) => void;
}

function ToggleField({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none',
        value ? 'bg-emerald-500' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          value ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white outline-none transition-all',
        'focus:border-violet-600/30 focus:ring-2 focus:ring-violet-600/10',
        props.className,
      )}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white outline-none transition-all resize-none',
        'focus:border-violet-600/30 focus:ring-2 focus:ring-violet-600/10',
        props.className,
      )}
    />
  );
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white outline-none transition-all',
        'focus:border-violet-600/30 focus:ring-2 focus:ring-violet-600/10',
        props.className,
      )}
    />
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-all',
            value === opt.value
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
        <Info className="h-6 w-6 text-violet-600" />
      </div>
      <p className="text-sm font-bold text-gray-500">Select an item...</p>
      <p className="text-[10px] text-gray-400 mt-1">
        Choose a topic or chapter to edit its properties
      </p>
    </div>
  );
}

function ChapterForm({ data, onSave }: { data?: any; onSave?: (d: any) => void }) {
  const [name, setName] = useState(data?.name ?? '');
  const [code, setCode] = useState(data?.code ?? '');
  const [plannedHours, setPlannedHours] = useState(data?.plannedHours ?? 10);
  const [estimatedSessions, setEstimatedSessions] = useState(data?.estimatedSessions ?? 8);
  const [isActive, setIsActive] = useState(data?.isActive ?? true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Layers className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-bold text-gray-800">Chapter Properties</span>
      </div>
      <div className="px-4 space-y-3">
        <FormField label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chapter name"
          />
        </FormField>
        <FormField label="Code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CH-001" />
        </FormField>
        <FormField label="Planned Hours">
          <Input
            type="number"
            value={plannedHours}
            onChange={(e) => setPlannedHours(Number(e.target.value))}
            min={0}
          />
        </FormField>
        <FormField label="Estimated Sessions">
          <Input
            type="number"
            value={estimatedSessions}
            onChange={(e) => setEstimatedSessions(Number(e.target.value))}
            min={0}
          />
        </FormField>
        <FormField label="Status">
          <div className="flex items-center gap-2">
            <ToggleField value={isActive} onChange={setIsActive} />
            <span
              className={cn(
                'text-[10px] font-bold',
                isActive ? 'text-emerald-600' : 'text-gray-400',
              )}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </FormField>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => onSave?.({ name, code, plannedHours, estimatedSessions, isActive })}
          className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function TopicForm({ data, onSave }: { data?: any; onSave?: (d: any) => void }) {
  const [name, setName] = useState(data?.name ?? '');
  const [code, setCode] = useState(data?.code ?? '');
  const [difficulty, setDifficulty] = useState(data?.difficultyLevel ?? 'MEDIUM');
  const [plannedHours, setPlannedHours] = useState(data?.plannedHours ?? 4);
  const [sessions, setSessions] = useState(data?.plannedSessions ?? 3);
  const [objectives, setObjectives] = useState(data?.learningObjectives ?? '');
  const [isActive, setIsActive] = useState(data?.isActive ?? true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <FileText className="h-4 w-4 text-violet-500" />
        <span className="text-xs font-bold text-gray-800">Topic Properties</span>
      </div>
      <div className="px-4 space-y-3">
        <FormField label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Topic name" />
        </FormField>
        <FormField label="Code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TP-001" />
        </FormField>
        <FormField label="Difficulty">
          <RadioGroup
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: 'EASY', label: 'Easy' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HARD', label: 'Hard' },
            ]}
          />
        </FormField>
        <FormField label="Planned Hours">
          <Input
            type="number"
            value={plannedHours}
            onChange={(e) => setPlannedHours(Number(e.target.value))}
            min={0}
          />
        </FormField>
        <FormField label="Sessions">
          <Input
            type="number"
            value={sessions}
            onChange={(e) => setSessions(Number(e.target.value))}
            min={0}
          />
        </FormField>
        <FormField label="Learning Objectives">
          <Textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={3}
            placeholder="What students will learn..."
          />
        </FormField>
        <FormField label="Status">
          <div className="flex items-center gap-2">
            <ToggleField value={isActive} onChange={setIsActive} />
            <span
              className={cn(
                'text-[10px] font-bold',
                isActive ? 'text-emerald-600' : 'text-gray-400',
              )}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </FormField>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() =>
            onSave?.({
              name,
              code,
              difficultyLevel: difficulty,
              plannedHours,
              plannedSessions: sessions,
              learningObjectives: objectives,
              isActive,
            })
          }
          className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function TopicItemForm({ data, onSave }: { data?: any; onSave?: (d: any) => void }) {
  const [status, setStatus] = useState(data?.status ?? 'DRAFT');
  const [completionRule, setCompletionRule] = useState(data?.completionRule ?? 'NONE');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <ClipboardList className="h-4 w-4 text-sky-500" />
        <span className="text-xs font-bold text-gray-800">Item Properties</span>
      </div>
      <div className="px-4 space-y-3">
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
        <FormField label="Completion Rule">
          <Select value={completionRule} onChange={(e) => setCompletionRule(e.target.value)}>
            <option value="NONE">None</option>
            <option value="OPEN">Open</option>
            <option value="WATCH_80_PERCENT">Watch 80%</option>
            <option value="WATCHED_FULL">Watched Full</option>
          </Select>
        </FormField>
      </div>

      {data && (
        <div className="border-t border-gray-100 mx-4 pt-3 space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <User className="h-3 w-3" />
            <span>By {data.createdBy ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(data.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={() => onSave?.({ status, completionRule })}
          className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

export function PropertiesPanel({
  selection,
  topicData,
  chapterData,
  onSave,
}: PropertiesPanelProps) {
  if (!selection.type || !selection.id) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-gray-100">
      {selection.type === 'chapter' && <ChapterForm data={chapterData} onSave={onSave} />}
      {selection.type === 'topic' && <TopicForm data={topicData} onSave={onSave} />}
      {selection.type === 'topic-item' && <TopicItemForm data={topicData} onSave={onSave} />}
    </div>
  );
}
