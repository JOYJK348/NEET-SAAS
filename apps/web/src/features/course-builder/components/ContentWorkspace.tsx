'use client';

import { BookPageEditor } from './BookPageEditor';

interface ContentWorkspaceProps {
  topicId: string | null;
  topicData?: any;
  onOpenAddBlocksTab?: () => void;
  onAddBlock?: (blockType: any) => void;
  addBlockTrigger?: { type: string; timestamp: number } | null;
}

export function ContentWorkspace({
  topicId,
  topicData,
  onOpenAddBlocksTab,
  onAddBlock,
  addBlockTrigger,
}: ContentWorkspaceProps) {
  return (
    <BookPageEditor
      topicId={topicId}
      topicData={topicData}
      onOpenAddBlocksTab={onOpenAddBlocksTab}
      onAddBlock={onAddBlock}
      addBlockTrigger={addBlockTrigger}
    />
  );
}
