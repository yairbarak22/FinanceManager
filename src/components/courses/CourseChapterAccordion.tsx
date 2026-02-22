'use client';

import { useMemo } from 'react';
import {
  ChevronLeft,
  Play,
  Lock,
  BookOpen,
  TrendingUp,
  Target,
  ListVideo,
  Snowflake,
  BarChart3,
  UserCheck,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Chapter, Lesson } from './coursesData';

const chapterIcons: Record<string, typeof BookOpen> = {
  BookOpen,
  TrendingUp,
  Target,
  Snowflake,
  BarChart3,
  UserCheck,
  Zap,
};

interface CourseChapterAccordionProps {
  chapters: Chapter[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string, chapterId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function getChapterDuration(lessons: Lesson[]): string {
  const totalSeconds = lessons.reduce((sum, l) => {
    const [min, sec] = l.duration.split(':').map(Number);
    return sum + min * 60 + sec;
  }, 0);
  const mins = Math.floor(totalSeconds / 60);
  return `${mins} דק׳`;
}

function getCompletedCount(lessons: Lesson[]): number {
  return lessons.filter((l) => l.status === 'completed').length;
}

/** Status icon for the chapter row */
function ChapterStatusIcon({ status, isActive, index }: { status: Lesson['status']; isActive: boolean; index: number }) {
  if (status === 'completed') {
    return (
      <div className="w-4 h-4 rounded-full bg-[#0DBACC]/12 flex items-center justify-center flex-shrink-0">
        <span className="text-[0.5625rem] font-bold text-[#0DBACC]">{index}</span>
      </div>
    );
  }
  if (status === 'locked') {
    return <Lock className="w-4 h-4 text-[#BDBDCB] flex-shrink-0" strokeWidth={1.75} />;
  }
  return (
    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#69ADFF]' : 'bg-[#69ADFF]/12'}`}>
      <Play className={`w-[7px] h-[7px] ms-px ${isActive ? 'text-white' : 'text-[#69ADFF]'}`} fill={isActive ? 'white' : '#69ADFF'} />
    </div>
  );
}

/** Status dot for collapsed view */
function ChapterDot({
  status,
  isActive,
  index,
  onClick,
  disabled,
}: {
  status: Lesson['status'];
  isActive: boolean;
  index: number;
  onClick: () => void;
  disabled: boolean;
}) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0';

  if (status === 'completed') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#0DBACC]/12 cursor-pointer transition-transform duration-150 hover:scale-110`}
        title={`פרק ${index}`}
      >
        <span className="text-[0.6875rem] font-bold text-[#0DBACC]">{index}</span>
      </button>
    );
  }
  if (status === 'locked') {
    return (
      <div className={`${base} bg-[#F7F7F8] opacity-50`} title={`פרק ${index}`}>
        <Lock className="w-3 h-3 text-[#BDBDCB]" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${base} cursor-pointer transition-transform duration-150 hover:scale-110
        ${isActive ? 'bg-[#69ADFF] shadow-[0_0_0_3px_rgba(105,173,255,0.2)]' : 'bg-[#69ADFF]/10'}
      `}
      title={`פרק ${index}`}
    >
      <span className={`text-[0.6875rem] font-bold ${isActive ? 'text-white' : 'text-[#69ADFF]'}`}>
        {index}
      </span>
    </button>
  );
}

export default function CourseChapterAccordion({
  chapters,
  activeLessonId,
  onSelectLesson,
  isCollapsed,
  onToggleCollapse,
}: CourseChapterAccordionProps) {
  const totalCompleted = useMemo(
    () => chapters.reduce((sum, ch) => sum + getCompletedCount(ch.lessons), 0),
    [chapters],
  );
  const totalLessons = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
    [chapters],
  );
  const overallProgress = totalLessons > 0 ? totalCompleted / totalLessons : 0;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 56 : 272 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-white border-e border-[#F7F7F8] overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className={`flex items-center border-b border-[#F7F7F8] ${isCollapsed ? 'justify-center py-3.5 px-2' : 'justify-between px-4 py-3.5'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <ListVideo className="w-4 h-4 text-[#69ADFF] flex-shrink-0" strokeWidth={1.75} />
            <h3 className="text-[0.8125rem] font-bold text-[#303150] whitespace-nowrap truncate">
              תוכן הקורס
            </h3>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer flex-shrink-0"
          title={isCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
        >
          <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
          </motion.div>
        </button>
      </div>

      {/* Progress — expanded only */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-[#F7F7F8]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.6875rem] text-[#BDBDCB]">
              {totalCompleted}/{totalLessons} פרקים
            </span>
            <span className="text-[0.6875rem] font-semibold text-[#69ADFF]">
              {Math.round(overallProgress * 100)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-[#E8E8ED] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#69ADFF]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-ghost">
        {isCollapsed ? (
          /* ===== COLLAPSED: chapter number dots ===== */
          <div className="flex flex-col items-center gap-1.5 py-3">
            {chapters.map((chapter, idx) => {
              const lesson = chapter.lessons[0];
              const isActive = lesson && lesson.id === activeLessonId;
              const isLocked = lesson?.status === 'locked';

              return (
                <ChapterDot
                  key={chapter.id}
                  status={lesson?.status ?? 'locked'}
                  isActive={!!isActive}
                  index={idx + 1}
                  disabled={isLocked}
                  onClick={() =>
                    lesson && !isLocked && onSelectLesson(lesson.id, chapter.id)
                  }
                />
              );
            })}
          </div>
        ) : (
          /* ===== EXPANDED: flat chapter list ===== */
          <div className="py-1">
            {chapters.map((chapter, chapterIdx) => {
              const Icon = chapterIcons[chapter.icon] || BookOpen;
              const lesson = chapter.lessons[0];
              const isActive = lesson && lesson.id === activeLessonId;
              const isLocked = lesson?.status === 'locked';
              const duration = getChapterDuration(chapter.lessons);
              const isLast = chapterIdx === chapters.length - 1;

              return (
                <button
                  key={chapter.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => lesson && !isLocked && onSelectLesson(lesson.id, chapter.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-4 py-3
                    transition-colors duration-150 text-start border-s-[3px]
                    ${isActive ? 'bg-[#69ADFF]/6 border-[#69ADFF]' : 'border-transparent'}
                    ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F7F7F8] cursor-pointer'}
                    ${!isLast ? 'border-b border-b-[#F7F7F8]' : ''}
                  `}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#69ADFF]/8 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.8125rem] truncate ${isActive ? 'font-bold text-[#303150]' : 'font-semibold text-[#303150]'}`}>
                      {chapter.title}
                    </p>
                    <p className="text-[0.6875rem] text-[#BDBDCB] mt-px">
                      {duration}
                    </p>
                  </div>
                  <ChapterStatusIcon status={lesson?.status ?? 'locked'} isActive={!!isActive} index={chapterIdx + 1} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
