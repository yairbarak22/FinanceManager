'use client';

import { useRef, useState, useEffect } from 'react';
import { Paperclip, StickyNote, MessageCircle, FileText, FileSpreadsheet, FileIcon, Presentation, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import type { AttachedFile } from './coursesData';

export type CourseTab = 'files' | 'notes' | 'questions';

const tabs: { id: CourseTab; label: string; icon: typeof Paperclip }[] = [
  { id: 'files', label: 'קבצים מצורפים', icon: Paperclip },
  { id: 'notes', label: 'הערות', icon: StickyNote },
  { id: 'questions', label: 'שאלות', icon: MessageCircle },
];

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  docx: FileIcon,
  pptx: Presentation,
};

const fileTypeStyles: Record<string, { icon: string; bg: string }> = {
  pdf: { icon: 'text-[#F18AB5]', bg: 'bg-[#F18AB5]/10' },
  xlsx: { icon: 'text-[#0DBACC]', bg: 'bg-[#0DBACC]/10' },
  docx: { icon: 'text-[#69ADFF]', bg: 'bg-[#69ADFF]/10' },
  pptx: { icon: 'text-[#E9A800]', bg: 'bg-[#E9A800]/10' },
};

interface CourseTabBarProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  files: AttachedFile[];
}

export default function CourseTabBar({ activeTab, onTabChange, files }: CourseTabBarProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const activeIdx = tabs.findIndex((t) => t.id === activeTab);
    const el = tabsRef.current[activeIdx];
    if (el) {
      setIndicatorStyle({ width: el.offsetWidth, left: el.offsetLeft });
    }
  }, [activeTab]);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Tab headers */}
      <div className="relative flex border-b border-[#F7F7F8]">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabsRef.current[i] = el; }}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.8125rem] font-semibold
                transition-colors duration-200 cursor-pointer relative z-10
                ${isActive ? 'text-[#69ADFF]' : 'text-[#7E7F90] hover:text-[#303150]'}
              `}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
        {/* Sliding indicator */}
        <motion.div
          className="absolute bottom-0 h-[2px] rounded-full bg-[#69ADFF]"
          animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      </div>

      {/* Tab content — fixed height to prevent layout shift */}
      <div className="h-[17rem] overflow-y-auto scrollbar-ghost">
        <div className="p-6">
          {activeTab === 'files' && (
            <div className="space-y-2">
              {files.map((file) => {
                const TypeIcon = fileTypeIcons[file.type] || FileIcon;
                const style = fileTypeStyles[file.type] || { icon: 'text-[#7E7F90]', bg: 'bg-[#F7F7F8]' };
                return (
                  <div
                    key={file.id}
                    className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[#F7F7F8] transition-colors duration-200 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      <TypeIcon className={`w-[1.125rem] h-[1.125rem] ${style.icon}`} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-semibold text-[#303150] truncate">{file.name}</p>
                      <p className="text-[0.75rem] text-[#BDBDCB]">{file.size}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-8 h-8 rounded-lg bg-[#69ADFF]/8 flex items-center justify-center">
                        <Download className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={1.75} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="flex flex-col items-center justify-center h-[13rem]">
              <div className="w-12 h-12 rounded-xl bg-[#F7F7F8] flex items-center justify-center mb-3">
                <StickyNote className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
              </div>
              <p className="text-[0.8125rem] font-medium text-[#7E7F90]">אין הערות עדיין</p>
              <p className="text-[0.75rem] text-[#BDBDCB] mt-1">הערות שתוסיפו יופיעו כאן</p>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="flex flex-col items-center justify-center h-[13rem]">
              <div className="w-12 h-12 rounded-xl bg-[#F7F7F8] flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
              </div>
              <p className="text-[0.8125rem] font-medium text-[#7E7F90]">אין שאלות עדיין</p>
              <p className="text-[0.75rem] text-[#BDBDCB] mt-1">שאלו שאלות ותקבלו תשובות מהמרצה</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
