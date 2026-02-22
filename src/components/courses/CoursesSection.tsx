'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, Clock, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import CourseChapterAccordion from './CourseChapterAccordion';
import CourseTabBar, { type CourseTab } from './CourseTabBar';
import { mockCourse } from './coursesData';

export default function CoursesSection() {
  const course = mockCourse;

  const [activeLessonId, setActiveLessonId] = useState(() => {
    for (const ch of course.chapters) {
      const active = ch.lessons.find((l) => l.status === 'active');
      if (active) return active.id;
    }
    return course.chapters[0]?.lessons[0]?.id ?? '';
  });

  const [activeTab, setActiveTab] = useState<CourseTab>('files');
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(true);

  const { activeLesson, activeChapter } = useMemo(() => {
    for (const ch of course.chapters) {
      const lesson = ch.lessons.find((l) => l.id === activeLessonId);
      if (lesson) return { activeLesson: lesson, activeChapter: ch };
    }
    return {
      activeLesson: course.chapters[0].lessons[0],
      activeChapter: course.chapters[0],
    };
  }, [activeLessonId, course.chapters]);

  const allLessons = useMemo(
    () => course.chapters.flatMap((ch) => ch.lessons),
    [course.chapters],
  );
  const currentLessonIndex = allLessons.findIndex(
    (l) => l.id === activeLessonId,
  );
  const totalLessons = allLessons.length;

  const totalDuration = useMemo(() => {
    const totalSeconds = allLessons.reduce((sum, l) => {
      const [min, sec] = l.duration.split(':').map(Number);
      return sum + min * 60 + sec;
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours} שעות ו-${mins} דק׳`;
    return `${mins} דק׳`;
  }, [allLessons]);

  const nextLesson = useMemo(() => {
    const next = allLessons[currentLessonIndex + 1];
    return next && next.status !== 'locked' ? next : null;
  }, [currentLessonIndex, allLessons]);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  const handleNextLesson = () => {
    if (nextLesson) setActiveLessonId(nextLesson.id);
  };

  return (
    <div className="flex -mt-4 lg:-mt-6 -mb-4 lg:-mb-6 -ms-4 lg:-ms-6 -me-4 lg:-me-6 min-h-[calc(100vh-4rem)]">
      {/* Playlist sidebar — flush to left edge, stretches full height */}
      <CourseChapterAccordion
        chapters={course.chapters}
        activeLessonId={activeLessonId}
        onSelectLesson={handleSelectLesson}
        isCollapsed={isPlaylistCollapsed}
        onToggleCollapse={() => setIsPlaylistCollapsed((v) => !v)}
      />

      {/* Main content area with padding */}
      <div className="flex-1 min-w-0 p-4 lg:p-6 space-y-6">
        {/* Course header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <h1 className="text-[1.5rem] font-bold text-[#303150] mb-1">
            {course.title}
          </h1>
          <p className="text-[0.9375rem] text-[#7E7F90] mb-4 max-w-xl">
            {course.description}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#7E7F90]">
              <BookOpen className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
              <span>{totalLessons} פרקים</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#7E7F90]">
              <Clock className="w-4 h-4 text-[#0DBACC]" strokeWidth={1.75} />
              <span>{totalDuration}</span>
            </div>
          </div>
        </motion.div>

        {/* Video player */}
        <VideoPlayer
          lesson={activeLesson}
          chapterTitle={activeChapter.title}
          lessonNumber={currentLessonIndex + 1}
          totalLessons={totalLessons}
        />

        {/* Author + next lesson */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <PieChart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.8125rem] font-bold text-[#303150]">
                {course.author.name}
              </p>
              <p className="text-[0.75rem] text-[#7E7F90]">
                {course.author.title}
              </p>
            </div>
          </div>

          {nextLesson && (
            <motion.button
              type="button"
              onClick={handleNextLesson}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 text-[0.8125rem] font-bold"
            >
              <span>פרק הבא</span>
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <CourseTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          files={course.attachedFiles}
        />
      </div>
    </div>
  );
}
