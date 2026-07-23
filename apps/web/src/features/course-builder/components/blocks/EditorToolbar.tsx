'use client';

import type { Editor } from '@tiptap/react';
import { Bold, Italic, Heading, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

const toolbarBtn = (active = false) =>
  cn(
    'flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-all',
    active
      ? 'bg-violet-100 text-violet-700'
      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
  );

export function EditorToolbar({ editor }: { editor: Editor }) {
  const tools = [
    {
      icon: <Bold className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      label: 'Bold',
    },
    {
      icon: <Italic className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      label: 'Italic',
    },
    {
      icon: <Heading className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
      label: 'Heading',
    },
    {
      icon: <List className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
      label: 'Bullet List',
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
      label: 'Ordered List',
    },
    {
      icon: <Quote className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
      label: 'Quote',
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={t.action}
          className={toolbarBtn(t.active)}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={toolbarBtn()}
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={toolbarBtn()}
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}
