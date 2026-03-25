import { appTutorialCourse } from '@/components/courses/appTutorialCourseData';
import type { Lesson } from '@/components/courses/coursesData';

export interface PageTutorialConfig {
  lesson: Lesson;
  summaryBullets: string[];
}

interface TutorialMapping {
  lessonId: string;
  summaryBullets: string[];
}

const SECTION_TUTORIALS: Record<string, TutorialMapping> = {
  goals: {
    lessonId: 'tut-l-1',
    summaryBullets: [
      'הגדרת יעדים פיננסיים עם תאריך יעד וסכום מטרה',
      'שימוש בסימולטור היעדים לתכנון חכם',
      'מעקב אחר ההתקדמות ועדכון שוטף',
    ],
  },
  budget: {
    lessonId: 'tut-l-1',
    summaryBullets: [
      'הגדרת תקציב חודשי לפי קטגוריות',
      'מעקב אחר חריגות ושמירה על מסגרת',
      'התאמת התקציב ליעדים הפיננסיים שלך',
    ],
  },
  portfolio: {
    lessonId: 'tut-l-2',
    summaryBullets: [
      'הזנת נכסים, התחייבויות ותשלומים קבועים',
      'חישוב הון נקי ומעקב אחר שינויים',
      'סקירה כוללת של המצב הפיננסי שלך',
    ],
  },
  activity: {
    lessonId: 'tut-l-3',
    summaryBullets: [
      'סקירה של כל ההכנסות וההוצאות החודשיות',
      'ניתוח פילוח הוצאות לפי קטגוריה',
      'זיהוי מגמות ושיפור התנהלות פיננסית',
    ],
  },
};

function findLesson(lessonId: string): Lesson | null {
  for (const chapter of appTutorialCourse.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

export function getSectionTutorialConfig(sectionKey: string): PageTutorialConfig | null {
  const mapping = SECTION_TUTORIALS[sectionKey];
  if (!mapping) return null;

  const lesson = findLesson(mapping.lessonId);
  if (!lesson || !lesson.videoUrl) return null;

  return { lesson, summaryBullets: mapping.summaryBullets };
}
