'use client';

import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import LessonBadge from './LessonBadge';
import type { Lesson } from './coursesData';

interface VideoPlayerProps {
  lesson: Lesson;
  chapterTitle: string;
  lessonNumber: number;
  totalLessons: number;
}

export default function VideoPlayer({ lesson, chapterTitle, lessonNumber, totalLessons }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Video area */}
      {lesson.videoUrl ? (
        /* ===== Real bunny.net iframe embed ===== */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full overflow-hidden rounded-t-3xl"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={lesson.videoUrl}
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      ) : (
        /* ===== Placeholder for lessons without video ===== */
        <div
          className="relative aspect-video overflow-hidden cursor-pointer"
          style={{ background: '#1C1C2E' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {/* Subtle ambient glow */}
          <div
            className="absolute w-[40%] h-[40%] rounded-full opacity-[0.08] blur-[80px]"
            style={{ background: '#69ADFF', top: '20%', right: '25%' }}
          />

          {/* Center play button */}
          <AnimatePresence>
            {(!isPlaying || isHovered) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ms-0.5" fill="white" />
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lesson counter pill */}
          <div className="absolute top-4 left-4 z-10">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white/80"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
            >
              <span>{lessonNumber}</span>
              <span className="text-white/30">/</span>
              <span className="text-white/40">{totalLessons}</span>
            </div>
          </div>

          {/* Bottom controls */}
          <motion.div
            initial={false}
            animate={{ opacity: isHovered || !isPlaying ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/50 to-transparent pt-10"
          >
            {/* Progress bar */}
            <div className="px-4 mb-1">
              <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#69ADFF]"
                  initial={{ width: '0%' }}
                  animate={{ width: '35%' }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer">
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white/70 transition-colors cursor-pointer">
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white/70 transition-colors cursor-pointer">
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <span className="text-white/40 text-[11px] font-medium ps-1">{lesson.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white/70 transition-colors cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white/70 transition-colors cursor-pointer">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lesson info */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-medium text-[#7E7F90] mb-1">{chapterTitle}</p>
            <h2 className="text-[1.125rem] font-bold text-[#303150]">{lesson.title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {lesson.badge && <LessonBadge type={lesson.badge} />}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#7E7F90]"
              style={{ background: '#F7F7F8' }}
            >
              <span>{lessonNumber}</span>
              <span className="text-[#BDBDCB]">/</span>
              <span className="text-[#BDBDCB]">{totalLessons}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
