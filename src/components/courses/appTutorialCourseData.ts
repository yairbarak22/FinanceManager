import type { Course } from './coursesData';

export const appTutorialCourse: Course = {
  id: 'app-tutorial-course',
  title: 'איך להשתמש ב-MyNeto',
  description: 'סרטוני הדרכה קצרים שיעזרו לך להכיר את המערכת ולהתחיל להשתמש בכל הכלים שלה.',
  author: {
    name: 'מערכת MyNeto',
    title: '',
    initials: 'mN',
  },
  chapters: [
    {
      id: 'tut-ch-1',
      title: 'יעדים ותקציב',
      icon: 'Target',
      lessons: [
        {
          id: 'tut-l-1',
          title: 'הסבר על הגדרת יעדים וקביעת תקציב',
          duration: '02:20',
          status: 'active',
          badge: 'FREE',
          videoUrl: 'https://www.youtube-nocookie.com/embed/we_4XhpK61E?rel=0&modestbranding=1&iv_load_policy=3',
        },
      ],
    },
    {
      id: 'tut-ch-2',
      title: 'נכסים והתחייבויות',
      icon: 'Landmark',
      lessons: [
        {
          id: 'tut-l-2',
          title: 'הסבר על נכסים והתחייבויות',
          duration: '02:11',
          status: 'active',
          badge: 'FREE',
          videoUrl: 'https://www.youtube-nocookie.com/embed/oV_RElIkync?rel=0&modestbranding=1&iv_load_policy=3',
        },
      ],
    },
    {
      id: 'tut-ch-3',
      title: 'תזרים חודשי',
      icon: 'ArrowLeftRight',
      lessons: [
        {
          id: 'tut-l-3',
          title: 'ניהול תזרים חודשי',
          duration: '03:03',
          status: 'active',
          badge: 'FREE',
          videoUrl: 'https://www.youtube-nocookie.com/embed/6scb7CSXIyE?rel=0&modestbranding=1&iv_load_policy=3',
        },
      ],
    },
  ],
  attachedFiles: [],
};
