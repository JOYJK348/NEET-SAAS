'use client';

import { useState, useCallback } from 'react';
import type { TopicItem, PracticeQuestionBlockContent, BlockContent } from '../../types';

interface PracticeQuestionBlockProps {
  item: TopicItem;
  content: PracticeQuestionBlockContent;
  isEditing: boolean;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onStartEdit: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function PracticeQuestionBlock({
  item,
  content,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
}: PracticeQuestionBlockProps) {
  const [question, setQuestion] = useState(content.question || '');
  const [options, setOptions] = useState<string[]>(content.options ?? ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(content.correctAnswer || '');
  const [explanation, setExplanation] = useState(content.explanation || '');

  const handleSave = useCallback(() => {
    onSave(item, {
      blockType: 'PRACTICE_QUESTION',
      question,
      options,
      correctAnswer,
      explanation,
    });
  }, [item, question, options, correctAnswer, explanation, onSave]);

  const updateOption = (idx: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="border border-orange-200 rounded-xl overflow-hidden bg-orange-50/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-orange-100">
            <span className="text-lg">❓</span>
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
              Practice Question
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-orange-200 bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
                Options
              </label>
              <div className="space-y-1.5">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600 w-5 shrink-0">
                      {OPTION_LABELS[idx]}.
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${OPTION_LABELS[idx]}`}
                      className="flex-1 h-9 px-3 text-sm rounded-lg border border-orange-200 bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
                Correct Answer
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-orange-200 bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select correct option</option>
                {OPTION_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
                Explanation (optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this answer is correct..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-orange-200 bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
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
      className="border border-orange-200 rounded-xl p-4 bg-orange-50/50 cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">❓</span>
        <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
          Practice Question
        </span>
      </div>
      {question ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">{question}</p>
          {options && options.length > 0 && options.some((o) => o) && (
            <div className="space-y-1">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-orange-100"
                >
                  <span className="text-xs font-bold text-orange-600 w-5">
                    {OPTION_LABELS[idx]}.
                  </span>
                  <span className="text-sm text-gray-700">{opt}</span>
                  {correctAnswer === OPTION_LABELS[idx] && (
                    <span className="ml-auto text-xs text-emerald-500 font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {explanation && (
            <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Explanation
              </span>
              <p className="text-sm text-emerald-800">{explanation}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-orange-400 italic">Click to add practice question...</p>
      )}
    </div>
  );
}
