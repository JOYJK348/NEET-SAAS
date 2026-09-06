'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Bot,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Loader2,
  Lightbulb,
  BookOpen,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface StructuredAiExplanation {
  stepByStepSolution: string[];
  keyConcepts: string[];
  optionAnalysis: {
    option: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  facultyTip: string;
}

export interface AiExplanationResponse {
  questionId: string;
  attemptId: string;
  selectedOption: string | null;
  correctOption: string;
  explanation: StructuredAiExplanation;
  cached: boolean;
  modelUsed?: string;
  fallbackUsed?: boolean;
}

interface AiDoubtSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  selectedOption: string | null;
  correctOption: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiDoubtSolverModal({
  isOpen,
  onClose,
  attemptId,
  questionId,
  questionNumber,
  questionText,
  options,
  selectedOption,
  correctOption,
}: AiDoubtSolverModalProps) {
  const [data, setData] = useState<AiExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !attemptId || !questionId) return;

    let isMounted = true;
    setIsLoading(true);
    setData(null);
    setChatMessages([]);

    async function fetchAiExplanation() {
      try {
        const res = await api.post<AiExplanationResponse>(
          `/online-exams/attempts/${attemptId}/questions/${questionId}/ai-explanation`,
          {},
        );
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to generate AI Doubt explanation';
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAiExplanation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, attemptId, questionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingChat]);

  if (!isOpen) return null;

  async function handleSendChat() {
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(newHistory);
    setIsSendingChat(true);

    try {
      const res = await api.post<{ reply: string }>(
        `/online-exams/attempts/${attemptId}/questions/${questionId}/ai-chat`,
        {
          message: userText,
          history: newHistory.slice(-6),
        },
      );
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send query';
      toast.error(msg);
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an issue processing your query. Please refer to the step-by-step solution breakdown above.',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#0F172A]">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300 shrink-0">
              <Bot className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  AI Doubt Solver
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Powered by AI
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium">
                Question {questionNumber} • Instant Doubt Resolution & Faculty Insights
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* Question Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                Question {questionNumber} Statement:
              </span>
              <div className="flex items-center gap-2">
                {selectedOption ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                    Your Choice: {selectedOption}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                    Unattempted
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Official Correct: Option {correctOption}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-relaxed">
              {questionText}
            </p>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 font-sans shadow-2xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-black text-slate-700">
                Analyzing Question Logic, Options & Formulas...
              </p>
              <p className="text-[11px] text-slate-400 font-semibold">
                Structuring step-by-step resolution and option breakdown.
              </p>
            </div>
          )}

          {/* AI Explanation Content */}
          {!isLoading && data?.explanation && (
            <div className="space-y-4">
              {/* Cache & Verification Badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ground Truth Verified with Official NTA Answer Key</span>
                </div>
                {data.cached && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-black rounded-md text-[10px]">
                    Instant Cache Response
                  </span>
                )}
              </div>

              {/* Key Concepts Badges */}
              {data.explanation.keyConcepts?.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-600" /> Key Concepts & Laws:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.explanation.keyConcepts.map((concept, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-extrabold"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Solution */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Step-by-Step Solution Walkthrough:
                </h4>
                <div className="space-y-2">
                  {data.explanation.stepByStepSolution?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Option-by-Option Analysis */}
              {data.explanation.optionAnalysis?.length > 0 && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-600" /> Option-by-Option Breakdown:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {data.explanation.optionAnalysis.map((opt) => {
                      const isCorrect = opt.isCorrect;
                      const isUserChoice = selectedOption === opt.option;

                      let borderStyle = 'border-slate-200 bg-slate-50/50';
                      if (isCorrect) {
                        borderStyle = 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-300/50';
                      } else if (isUserChoice) {
                        borderStyle = 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-300/50';
                      }

                      return (
                        <div key={opt.option} className={`p-3 rounded-xl border text-xs space-y-1 ${borderStyle}`}>
                          <div className="flex items-center justify-between font-black text-slate-900">
                            <span className="flex items-center gap-1.5">
                              <span>Option {opt.option}</span>
                              {isUserChoice && (
                                <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-black rounded-md">
                                  YOUR CHOICE
                                </span>
                              )}
                            </span>
                            {isCorrect ? (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> CORRECT
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-extrabold">INCORRECT</span>
                            )}
                          </div>
                          <p className="text-slate-700 text-xs font-medium leading-normal">
                            {opt.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faculty Pro-Tip Callout Box */}
              {data.explanation.facultyTip && (
                <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex items-start gap-3 text-amber-900 shadow-2xs">
                  <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Faculty Pro-Tip & Exam Strategy:
                    </h5>
                    <p className="text-xs font-medium leading-relaxed text-amber-900">
                      {data.explanation.facultyTip}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Follow-up Chat Section */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-blue-600" /> Ask Follow-up Doubts:
                  </h4>
                  <span className="text-[10px] text-slate-400 font-extrabold">
                    Interactive Doubt Assistant
                  </span>
                </div>

                {/* Chat History List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3 italic">
                      Have a specific doubt about this question? Ask below (e.g. &quot;Why is Option B wrong?&quot; or &quot;Can you give a formula recap?&quot;)
                    </p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none shadow-2xs font-semibold'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 border border-slate-200 text-slate-500 p-2.5 rounded-2xl text-xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>AI is crafting your response...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask a follow-up doubt about this problem..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    disabled={isSendingChat}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isSendingChat}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
          <span>AI Doubt Engine v1.0 • Strictly Aligned with NTA Curriculum</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs transition cursor-pointer shadow-2xs"
          >
            Close Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
