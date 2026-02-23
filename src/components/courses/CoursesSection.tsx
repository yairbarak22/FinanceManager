'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, ExternalLink, PieChart, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import CourseChapterAccordion from './CourseChapterAccordion';
import CourseTabBar, { type CourseTab } from './CourseTabBar';
import AltshulerCTA from './AltshulerCTA';
import { mockCourse } from './coursesData';
import { useAnalytics } from '@/hooks/useAnalytics';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=Myneto&utm_medium=Link';

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
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);

  const WATCHED_KEY = 'myneto-watched-lessons';
  const [watchedLessonIds, setWatchedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHED_KEY);
      if (stored) {
        setWatchedLessonIds(new Set(JSON.parse(stored) as string[]));
      }
    } catch { /* noop */ }
  }, []);

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

  const { trackVideoLessonViewed, trackOpenTradingAccountClicked } = useAnalytics();

  useEffect(() => {
    if (activeLesson?.videoUrl) {
      trackVideoLessonViewed(activeLesson.id, activeLesson.title, activeChapter.title, currentLessonIndex);

      setWatchedLessonIds((prev) => {
        if (prev.has(activeLesson.id)) return prev;
        const next = new Set(prev);
        next.add(activeLesson.id);
        try { localStorage.setItem(WATCHED_KEY, JSON.stringify([...next])); } catch { /* noop */ }
        return next;
      });
    }
  }, [activeLessonId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        watchedLessonIds={watchedLessonIds}
      />

      {/* Main content area with padding */}
      <div className="flex-1 min-w-0 p-4 lg:p-6 space-y-6">
        {/* Course header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
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
            </div>
            <motion.a
              href={PARTNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOpenTradingAccountClicked('course_header')}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 bg-[#69ADFF] text-white px-4 py-2 rounded-xl text-[0.8125rem] font-medium shadow-sm hover:shadow-md transition-shadow whitespace-nowrap flex-shrink-0"
            >
              
              <span>לפתיחת תיק מסחר</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.a>
          </div>
        </motion.div>

        {/* Video player */}
        <VideoPlayer
          lesson={activeLesson}
          chapterTitle={activeChapter.title}
          lessonNumber={currentLessonIndex + 1}
          totalLessons={totalLessons}
        />

        {/* Altshuler CTA - show for lessons 3 and 4 */}
        {(activeLessonId === 'l-3' || activeLessonId === 'l-4') && <AltshulerCTA />}

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
              {course.author.title && (
                <p className="text-[0.75rem] text-[#7E7F90]">
                  {course.author.title}
                </p>
              )}
              <p className="text-[0.625rem] text-[#BDBDCB] mt-0.5">
                תוכן זה אינו מהווה ייעוץ השקעות
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
          files={activeLesson.attachedFiles ?? course.attachedFiles}
          notes={activeLesson.notes}
        />

        {/* Financial disclaimer */}
        <div className="flex items-start gap-2 py-3 px-4 rounded-xl bg-[#F7F7F8]/60 border border-[#F7F7F8]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#BDBDCB] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[0.6875rem] text-[#BDBDCB] leading-relaxed">
            האמור בקורס זה אינו מהווה ייעוץ השקעות, שיווק השקעות, ייעוץ מס, או תחליף לייעוץ אישי המותאם לנתוני כל אדם. אין לראות באמור המלצה לביצוע עסקאות בניירות ערך או מוצרים פיננסיים. מערכת myNETO אינה בעלת רישיון ייעוץ השקעות.
          </p>
        </div>
      </div>
    </div>
  );
}
