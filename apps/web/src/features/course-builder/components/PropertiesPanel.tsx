'use client';

import { useState } from 'react';
import {
  Save,
  Layers,
  FileText,
  ClipboardList,
  Info,
  Calendar,
  User,
  Plus,
  Lightbulb,
  Star,
  Sigma,
  GraduationCap,
  HelpCircle,
  Minus,
  Settings,
  Link,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
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

interface BlockTypeOption {
  blockType: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const blockTypeOptions: BlockTypeOption[] = [
  {
    blockType: 'TEXT',
    label: 'Text',
    icon: <FileText className="h-3.5 w-3.5" />,
    description: 'Rich text content',
  },
  {
    blockType: 'KEY_CONCEPT',
    label: 'Key Concept',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    description: 'Highlight a key concept',
  },
  {
    blockType: 'IMPORTANT_NOTE',
    label: 'Important Note',
    icon: <Star className="h-3.5 w-3.5" />,
    description: 'Important information',
  },
  {
    blockType: 'FORMULA',
    label: 'Formula',
    icon: <Sigma className="h-3.5 w-3.5" />,
    description: 'Mathematical equation',
  },
  {
    blockType: 'WORKED_EXAMPLE',
    label: 'Worked Example',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    description: 'Example with solution',
  },
  {
    blockType: 'PRACTICE_QUESTION',
    label: 'Practice Q',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    description: 'Question for practice',
  },
  {
    blockType: 'DIVIDER',
    label: 'Divider',
    icon: <Minus className="h-3.5 w-3.5" />,
    description: 'Horizontal separator',
  },
  {
    blockType: 'IMAGE',
    label: 'Image',
    icon: <ImageIcon className="h-3.5 w-3.5" />,
    description: 'Visual content',
  },
];

const mediaBlockOptions: BlockTypeOption[] = [
  {
    blockType: 'PDF',
    label: 'Upload Document',
    icon: <FileText className="h-3.5 w-3.5" />,
    description: 'PDF / document file',
  },
  {
    blockType: 'VIDEO',
    label: 'Video',
    icon: <Video className="h-3.5 w-3.5" />,
    description: 'Embed or upload video',
  },
  {
    blockType: 'LINK',
    label: 'External Link',
    icon: <Link className="h-3.5 w-3.5" />,
    description: 'Link to external resource',
  },
];

function AddBlocksTab({ onSelectBlock }: { onSelectBlock?: (blockType: string) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Content Blocks
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {blockTypeOptions.map((opt) => (
            <button
              key={opt.blockType}
              onClick={() => onSelectBlock?.(opt.blockType)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left shadow-sm"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 text-gray-500 shrink-0">
                {opt.icon}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-700 block">{opt.label}</span>
                <span className="text-[9px] text-gray-400">{opt.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Media & Resources
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {mediaBlockOptions.map((opt) => (
            <button
              key={opt.blockType}
              onClick={() => onSelectBlock?.(opt.blockType)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all text-left shadow-sm"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 text-gray-500 shrink-0">
                {opt.icon}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-700 block">{opt.label}</span>
                <span className="text-[9px] text-gray-400">{opt.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockSettingsTab({ topicData }: { topicData?: any }) {
  if (!topicData) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-400">Select a block to edit its settings</p>
      </div>
    );
  }
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Block Settings
        </span>
      </div>
      <TopicItemForm data={topicData} />
    </div>
  );
}

function TopicSettingsTab({ topicData, onSave }: { topicData?: any; onSave?: (d: any) => void }) {
  if (!topicData) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-400">No topic selected</p>
      </div>
    );
  }
  return <TopicForm data={topicData} onSave={onSave} />;
}

type TabId = 'add-blocks' | 'block-settings' | 'topic-settings';

export function PropertiesPanel({
  selection,
  topicData,
  chapterData,
  onSave,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('add-blocks');

  // If chapter selected, show chapter form directly (no tabs)
  if (selection.type === 'chapter') {
    return (
      <div className="divide-y divide-gray-100">
        <ChapterForm data={chapterData} onSave={onSave} />
      </div>
    );
  }

  // If topic-item selected, show item form directly (no tabs for now)
  if (selection.type === 'topic-item') {
    return (
      <div className="divide-y divide-gray-100">
        <TopicItemForm data={topicData} onSave={onSave} />
      </div>
    );
  }

  // If no selection
  if (!selection.type || !selection.id) {
    return <EmptyState />;
  }

  // Topic selected - show tabbed interface
  // Only show topic-settings if we have topicData
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'add-blocks', label: 'Blocks', icon: <Plus className="h-3 w-3" /> },
    { id: 'block-settings', label: 'Block', icon: <Settings className="h-3 w-3" /> },
    { id: 'topic-settings', label: 'Topic', icon: <FileText className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-100 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 flex-1 px-3 py-2.5 text-[10px] font-bold transition-all',
              activeTab === tab.id
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/30'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'add-blocks' && <AddBlocksTab />}
        {activeTab === 'block-settings' && <BlockSettingsTab topicData={topicData} />}
        {activeTab === 'topic-settings' && (
          <TopicSettingsTab topicData={topicData} onSave={onSave} />
        )}
      </div>
    </div>
  );
}
