'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Send,
  Loader2,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Parses inline markdown (**bold**, $math$, `code`) into clean React elements
 */
function parseInlineFormatting(text: string) {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-black text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathStr = part.replace(/^\$+|\$+$/g, '');
      return (
        <span
          key={i}
          className="font-mono text-blue-900 bg-blue-50/90 border border-blue-200/80 px-1.5 py-0.5 rounded font-bold text-[11px] sm:text-xs inline-block mx-0.5"
        >
          {mathStr}
        </span>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono bg-slate-100 text-blue-800 px-1 py-0.5 rounded text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Rich Academic Markdown Renderer for AI Chat Messages
 */
function FormattedChatMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-line break-words text-xs sm:text-sm leading-relaxed">{content}</p>;
  }

  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800 break-words">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n').filter(Boolean);

        // Bullet point list
        const isBulletList = lines.length > 1 && lines.every((l) => /^\s*[\*\-\•]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 pl-1 my-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*[\*\-\•]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <span className="flex-1">{parseInlineFormatting(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered list
        const isNumberedList = lines.length > 1 && lines.every((l) => /^\s*\d+[\.\)]\s+/.test(l));
        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 pl-1 my-1">
              {lines.map((line, lIdx) => {
                const match = line.match(/^\s*(\d+)[\.\)]\s+(.*)/);
                const num = match ? match[1] : String(lIdx + 1);
                const cleanLine = match ? match[2] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="flex-1">{parseInlineFormatting(cleanLine)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph or heading
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              // Markdown Heading 1-4
              if (/^#{1,4}\s+/.test(line)) {
                const cleanHeading = line.replace(/^#{1,4}\s+/, '');
                return (
                  <h4
                    key={lIdx}
                    className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-blue-900 my-1"
                  >
                    {parseInlineFormatting(cleanHeading)}
                  </h4>
                );
              }

              // Heading-like Colon header (e.g. "Key Concept:", "Formula:")
              if (/^(?:[A-Z][A-Za-z0-9\s\(\)\-\_]{2,25}):$/i.test(line.trim())) {
                return (
                  <h4
                    key={lIdx}
                    className="font-black text-slate-900 text-xs tracking-wide text-blue-900 my-1"
                  >
                    {line.trim()}
                  </h4>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed text-slate-800">
                  {parseInlineFormatting(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AiDoubtSolverPageContent() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSendingChat]);

  async function handleSendChat(customMessage?: string) {
    const userText = (customMessage || chatInput).trim();
    if (!userText || isSendingChat) return;

    setChatInput('');
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(newHistory);
    setIsSendingChat(true);

    try {
      const res = await api.post<{ reply: string }>(
        `/online-exams/attempts/general/questions/general/ai-chat`,
        {
          message: userText,
          history: newHistory.slice(-6),
        },
      );
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      const fallbackReply = buildGeneralFallbackReply(userText);
      setChatMessages([...newHistory, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setIsSendingChat(false);
    }
  }

  function buildGeneralFallbackReply(userMessage: string): string {
    const lower = userMessage.toLowerCase().trim();

    if (/c[ou]{1,2}l[ou]{1,2}mb/i.test(lower)) {
      return `### Coulomb ($C$) Definition & Formula\n\n**Coulomb** is the SI unit of electric charge.\n\n* **Formula**: $Q = I \\cdot t$ (where $I$ = current in Amperes, $t$ = time in seconds).\n* **Quantization**: $1 \\text{ Coulomb} = 6.24 \\times 10^{18} \\text{ electrons}$.`;
    }

    if (/amp[e|a]?r/i.test(lower)) {
      return `### Ampere ($A$) Definition & Formula\n\n**Ampere** is the base SI unit of electric current.\n\n* **Formula**: $I = \\frac{Q}{t}$ ($1 \\text{ Ampere} = 1 \\text{ Coulomb per second}$).`;
    }

    if (/physic|formula/i.test(lower)) {
      return `### Key NEET Physics High-Yield Formulas\n\n1. **Kinematics**: $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$\n2. **Newton's Laws**: $F = ma$, $p = mv$\n3. **Work-Energy**: $W = F \\cdot s \\cdot \\cos\\theta$, $K = \\frac{1}{2}mv^2$\n4. **Optics**: $\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$`;
    }

    if (/biolog|gene|cell|dna|heredity/i.test(lower)) {
      return `### Core NCERT Biology Concept\n\n* **Gene**: The basic structural and functional unit of heredity.\n* **Chromosome**: Organized structure carrying genes in cell nuclei.\n* **Allele**: Alternative forms of a gene.`;
    }

    return `Here is a clear breakdown for your doubt **"${userMessage}"**:\n\n* **Core NCERT Law**: Focus on standard definitions, SI units, and formula variables.\n* **Exam Strategy**: Eliminate distractors systematically by checking dimensions and principles.\n\nWhat specific formula, concept, or doubt would you like to explore next?`;
  }

  return (
    <div className="w-full pb-20 space-y-4 font-sans text-slate-900 bg-white min-h-screen">
      {/* Sleek Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 sm:p-5 rounded-2xl shadow-2xs border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <Link href="/dashboard/student" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
              Student Portal
            </Link>
            <span>/</span>
            <span>AI Doubt Solver</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2">
            <span>Conversational AI Tutor</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              24/7 Active
            </span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Ask any academic doubt, question, formula, or concept clarification
          </p>
        </div>

        <button
          onClick={() => setChatMessages([])}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-extrabold shadow-2xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Conversational Chat Workspace */}
      <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col min-h-[520px] shadow-2xs overflow-hidden">
        {/* Chat Messages Window Stream */}
        <div className="flex-1 p-3.5 sm:p-5 space-y-4 overflow-y-auto bg-slate-50/30">
          {/* Welcome Message */}
          <div className="flex justify-start">
            <div className="max-w-[92%] sm:max-w-[85%] p-4 rounded-2xl bg-slate-100/90 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed space-y-2 break-words">
              <div className="text-blue-900 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Tutor:
              </div>
              <FormattedChatMessage
                isUser={false}
                content={`Hello! I am your 24/7 AI Academic Tutor for **NEET Preparation**.\n\nYou can ask me any academic doubt, formula, concept clarification, or study strategy! What would you like to ask?`}
              />
            </div>
          </div>

          {/* Chat Stream */}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-[#0052CC] text-white rounded-br-none font-semibold shadow-2xs'
                    : 'bg-slate-100/90 text-slate-800 rounded-bl-none shadow-2xs'
                }`}
              >
                <FormattedChatMessage content={msg.content} isUser={msg.role === 'user'} />
              </div>
            </div>
          ))}

          {isSendingChat && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 p-3 rounded-2xl text-xs flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052CC]" />
                <span>Generating faculty explanation...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 border border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-1 flex items-center transition">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask any academic doubt, formula, or question..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
              disabled={isSendingChat}
            />
            <button
              onClick={() => handleSendChat()}
              disabled={!chatInput.trim() || isSendingChat}
              className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Doubt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiDoubtSolverPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <AiDoubtSolverPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
