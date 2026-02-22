// Types & mock data for video course system

export type LessonBadgeType = 'FREE' | 'BEGINNER' | 'INTERMEDIATE' | 'PREMIUM';

export type LessonStatus = 'completed' | 'active' | 'available' | 'locked';

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "12:30"
  status: LessonStatus;
  badge?: LessonBadgeType;
  videoUrl?: string; // bunny.net iframe embed URL
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
  title: 'המסלול הבטוח: מחיסכון להשקעה חכמה (ב-4 צעדים)',
  description: 'קורס מעשי שמסביר איך לעבור מחיסכון בבנק להשקעה חכמה. ללא מושגים באוויר, עם דגש על אחריות כלכלית ודאגה לעתיד המשפחה.',
  author: {
    name: 'מערכת myNETO',
    title: '',
    initials: 'mN',
  },
  chapters: [
    {
      id: 'ch-1',
      title: 'כדור השלג של הכסף',
      icon: 'Snowflake',
      lessons: [
        { id: 'l-1', title: 'למה חיסכון בבנק כבר לא מספיק?', duration: '03:24', status: 'completed', badge: 'FREE', videoUrl: 'https://iframe.mediadelivery.net/embed/603432/f45955da-6080-4000-9fcf-a68296c17ac8?autoplay=false&loop=false&muted=false&preload=true&responsive=true' },
      ],
    },
    {
      id: 'ch-2',
      title: 'סוד ה-S&P 500',
      icon: 'BarChart3',
      lessons: [
        { id: 'l-2', title: 'למה הסטטיסטיקה מנצחת את המומחים?', duration: '03:41', status: 'completed', badge: 'BEGINNER', videoUrl: 'https://iframe.mediadelivery.net/embed/603432/e7cdbc45-650f-4a85-bd19-39b09cee83e5?autoplay=false&loop=false&muted=false&preload=true&responsive=true' },
      ],
    },
    {
      id: 'ch-3',
      title: 'תכל׳ס - פתיחת חשבון',
      icon: 'UserCheck',
      lessons: [
        { id: 'l-3', title: 'פותחים חשבון באלטשולר שחם (צעד אחר צעד)', duration: '04:24', status: 'completed', badge: 'BEGINNER', videoUrl: 'https://iframe.mediadelivery.net/embed/603432/fbb27781-4823-46d2-93ef-cebd6317c75d?autoplay=false&loop=false&muted=false&preload=true&responsive=true' },
      ],
    },
    {
      id: 'ch-4',
      title: 'טייס אוטומטי',
      icon: 'Zap',
      lessons: [
        { id: 'l-4', title: 'בחירת המסלול והוראת הקבע', duration: '10:15', status: 'available', badge: 'INTERMEDIATE' },
      ],
    },
  ],
  attachedFiles: [
    { id: 'f-1', name: 'מדריך פתיחת חשבון - צעד אחר צעד.pdf', type: 'pdf', size: '1.8 MB' },
    { id: 'f-2', name: 'טבלת חישוב ריבית דריבית.xlsx', type: 'xlsx', size: '0.9 MB' },
    { id: 'f-3', name: 'סיכום הקורס - 4 הצעדים.pdf', type: 'pdf', size: '0.5 MB' },
  ],
};
