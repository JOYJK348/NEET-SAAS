'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, WorkedExampleBlockContent, BlockContent } from '../../types';

interface WorkedExampleBlockProps {
  item: TopicItem;
  content: WorkedExampleBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function WorkedExampleBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: WorkedExampleBlockProps) {
  const [question, setQuestion] = useState(content.question || '');
  const [solution, setSolution] = useState(content.solution || '');
  const [answer, setAnswer] = useState(content.answer || '');

  const handleSave = useCallback(() => {
    onSave(item, { blockType: 'WORKED_EXAMPLE', question, solution, answer });
  }, [item, question, solution, answer, onSave]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-emerald-100">
            <span className="text-lg">📐</span>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Worked Example
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the example question..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Solution
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Step-by-step solution..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Answer (optional)
              </label>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Final answer"
                className="w-full h-9 px-3 text-sm rounded-lg border border-emerald-200 bg-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancelEdit}
            className="h-8 px-3 rounded-xl text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 h-8 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(item)}
      className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50 cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📐</span>
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Worked Example
        </span>
      </div>
      {question ? (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Question
            </span>
            <p className="text-sm text-gray-800">{question}</p>
          </div>
          {solution && (
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Solution
              </span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{solution}</p>
            </div>
          )}
          {answer && (
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Answer
              </span>
              <p className="text-sm font-bold text-emerald-800">{answer}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-emerald-400 italic">Click to add worked example...</p>
      )}
    </div>
  );
}
