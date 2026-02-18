// Types & mock data for video course system

export type LessonBadgeType = 'FREE' | 'BEGINNER' | 'INTERMEDIATE' | 'PREMIUM';

export type LessonStatus = 'completed' | 'active' | 'available' | 'locked';

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "12:30"
  status: LessonStatus;
  badge?: LessonBadgeType;
}

export interface Chapter {
  id: string;
  title: string;
  icon: string; // lucide icon name
  lessons: Lesson[];
}

export interface AttachedFile {
  id: string;
  name: string;
  type: 'pdf' | 'xlsx' | 'docx' | 'pptx';
  size: string; // e.g. "2.4 MB"
}

export interface CourseAuthor {
  name: string;
  title: string;
  initials: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  author: CourseAuthor;
  chapters: Chapter[];
  attachedFiles: AttachedFile[];
}

export const mockCourse: Course = {
  id: 'course-1',
  title: 'ניהול כסף חכם - קורס מקיף',
  description: 'למדו כיצד לנהל את הכסף שלכם בצורה חכמה, לחסוך יותר ולהשקיע נכון לעתיד.',
  author: {
    name: 'יאיר ברק',
    title: 'יועץ פיננסי מוסמך',
    initials: 'יב',
  },
  chapters: [
    {
      id: 'ch-1',
      title: 'יסודות ניהול פיננסי',
      icon: 'BookOpen',
      lessons: [
        { id: 'l-1', title: 'מבוא לניהול כספים אישי', duration: '8:45', status: 'completed', badge: 'FREE' },
        { id: 'l-2', title: 'הבנת הכנסות והוצאות', duration: '12:30', status: 'completed', badge: 'BEGINNER' },
        { id: 'l-3', title: 'בניית תקציב חודשי', duration: '15:20', status: 'completed' },
        { id: 'l-4', title: 'מעקב אחר הוצאות יומיומיות', duration: '10:15', status: 'active', badge: 'BEGINNER' },
      ],
    },
    {
      id: 'ch-2',
      title: 'חיסכון והשקעות',
      icon: 'TrendingUp',
      lessons: [
        { id: 'l-5', title: 'עקרונות החיסכון', duration: '11:00', status: 'available', badge: 'INTERMEDIATE' },
        { id: 'l-6', title: 'סוגי חשבונות חיסכון', duration: '9:30', status: 'available' },
        { id: 'l-7', title: 'מבוא להשקעות בשוק ההון', duration: '18:45', status: 'available', badge: 'INTERMEDIATE' },
        { id: 'l-8', title: 'פיזור סיכונים ותיק השקעות', duration: '14:20', status: 'locked', badge: 'PREMIUM' },
      ],
    },
    {
      id: 'ch-3',
      title: 'תכנון פיננסי מתקדם',
      icon: 'Target',
      lessons: [
        { id: 'l-9', title: 'הגדרת יעדים פיננסיים', duration: '13:10', status: 'locked' },
        { id: 'l-10', title: 'ביטוחים ורשת ביטחון', duration: '16:40', status: 'locked', badge: 'PREMIUM' },
        { id: 'l-11', title: 'תכנון פרישה ופנסיה', duration: '20:00', status: 'locked', badge: 'PREMIUM' },
      ],
    },
  ],
  attachedFiles: [
    { id: 'f-1', name: 'תבנית תקציב חודשי.xlsx', type: 'xlsx', size: '1.2 MB' },
    { id: 'f-2', name: 'מדריך השקעות למתחילים.pdf', type: 'pdf', size: '3.8 MB' },
    { id: 'f-3', name: 'רשימת בדיקה פיננסית.pdf', type: 'pdf', size: '0.5 MB' },
    { id: 'f-4', name: 'מצגת סיכום הקורס.pptx', type: 'pptx', size: '5.1 MB' },
  ],
};
