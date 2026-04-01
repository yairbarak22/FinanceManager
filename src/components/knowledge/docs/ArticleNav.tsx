'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';

interface ArticleNavProps {
  prev: Article | null;
  next: Article | null;
}

export default function ArticleNav({ prev, next }: ArticleNavProps) {
  if (!prev && !next) return null;

  return (
    <div className="flex gap-4 mt-10 pt-6 border-t border-[#F7F7F8]">
      {/* Next article (RTL: appears on right = start) */}
      {next ? (
        <Link
          href={`/knowledge/${next.slug}`}
          className="group flex-1 flex items-center gap-3 p-4 rounded-xl border border-[#F7F7F8] hover:border-[#69ADFF] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#BDBDCB] group-hover:text-[#69ADFF] transition-colors flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-[#BDBDCB] mb-0.5">הבא</p>
            <p className="text-[13px] font-medium text-[#303150] group-hover:text-[#69ADFF] transition-colors truncate">
              {next.title}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Previous article (RTL: appears on left = end) */}
      {prev ? (
        <Link
          href={`/knowledge/${prev.slug}`}
          className="group flex-1 flex items-center justify-end gap-3 p-4 rounded-xl border border-[#F7F7F8] hover:border-[#69ADFF] transition-colors text-end"
        >
          <div className="min-w-0">
            <p className="text-[11px] text-[#BDBDCB] mb-0.5">הקודם</p>
            <p className="text-[13px] font-medium text-[#303150] group-hover:text-[#69ADFF] transition-colors truncate">
              {prev.title}
            </p>
          </div>
          <ChevronLeft className="w-5 h-5 text-[#BDBDCB] group-hover:text-[#69ADFF] transition-colors flex-shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
