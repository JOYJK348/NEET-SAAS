'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  html: string;
  onChange: (html: string, wordCount: number) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  html,
  onChange,
  placeholder = 'Type your content here...',
  minHeight = '150px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: html || '<p></p>',
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      const wordCount = editor.storage.characterCount?.words?.() ?? 0;
      onChange(newHtml, wordCount);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 text-sm text-gray-700',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <EditorToolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
