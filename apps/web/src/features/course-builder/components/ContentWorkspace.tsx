'use client';

import { BookPageEditor } from './BookPageEditor';

interface ContentWorkspaceProps {
  topicId: string | null;
  topicData?: any;
}

export function ContentWorkspace({ topicId, topicData }: ContentWorkspaceProps) {
  return <BookPageEditor topicId={topicId} topicData={topicData} />;
}
