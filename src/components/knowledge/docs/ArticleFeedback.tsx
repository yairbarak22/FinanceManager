'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

export default function ArticleFeedback() {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  if (feedback) {
    return (
      <div className="flex items-center gap-2 py-4 text-[13px] text-[#0DBACC]">
        <Check className="w-4 h-4" />
        <span>תודה על המשוב!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-4">
      <span className="text-[13px] text-[#7E7F90]">האם המדריך עזר לך?</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setFeedback('up')}
          className="p-2 rounded-lg hover:bg-[#B4F1F1]/30 transition-colors cursor-pointer"
          aria-label="כן, עזר"
        >
          <ThumbsUp className="w-4 h-4 text-[#BDBDCB] hover:text-[#0DBACC]" />
        </button>
        <button
          onClick={() => setFeedback('down')}
          className="p-2 rounded-lg hover:bg-[#FFC0DB]/30 transition-colors cursor-pointer"
          aria-label="לא, לא עזר"
        >
          <ThumbsDown className="w-4 h-4 text-[#BDBDCB] hover:text-[#F18AB5]" />
        </button>
      </div>
    </div>
  );
}
