import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import VideoEmbed from '@/components/knowledge/VideoEmbed';

export const courseContent: Record<string, ReactNode> = {
  'video-course': (
    <div dir="rtl">
      <p>
        קורס וידאו קצר (~14 דקות) שמסביר את כל מה שצריך לדעת כדי
        להתחיל להשקיע. ארבעה שיעורים, מהבסיס ועד ביצוע.
      </p>

      <h2 id="lesson-1">שיעור 1: כדור השלג של הכסף</h2>
      <VideoEmbed
        youtubeId="eSPdAfQmDRA"
        title="למה חיסכון בבנק כבר לא מספיק?"
        duration="03:24"
        bullets={[
          'איך אינפלציה אוכלת את הכסף שיושב בבנק',
          'מה ההבדל בין חיסכון להשקעה',
          'למה ריבית דריבית היא הכוח שישנה לכם את החיים',
        ]}
      />

      <h2 id="lesson-2">שיעור 2: סוד ה-S&amp;P 500</h2>
      <VideoEmbed
        youtubeId="AvmYuJrEF18"
        title="למה הסטטיסטיקה מנצחת את המומחים?"
        duration="03:41"
        bullets={[
          'מה זה מדד S&P 500 ולמה הוא עובד',
          'למה 94% מהמנהלים האקטיביים מפסידים למדד',
          'מה זה השקעה פסיבית ואיך היא חוסכת לכם כסף',
        ]}
      />

      <h2 id="lesson-3">שיעור 3: פותחים חשבון</h2>
      <VideoEmbed
        youtubeId="SVZnToUSRMg"
        title="פותחים חשבון באלטשולר שחם"
        duration="04:24"
        bullets={[
          'תהליך פתיחת חשבון מסחר צעד אחר צעד',
          'איך לבחור מסלול',
          'מה ההטבות שמקבלים דרך MyNeto',
        ]}
      />

      <h2 id="lesson-4">שיעור 4: טייס אוטומטי</h2>
      <VideoEmbed
        youtubeId="TdA1O5MeifQ"
        title="בחירת המסלול והוראת הקבע"
        duration="02:34"
        bullets={[
          'איך לבחור קרן מחקה S&P 500',
          'הגדרת הוראת קבע חודשית – פעם אחת ושוכחים',
          'למה זה הצעד הכי חשוב שתעשו',
        ]}
      />

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> צפו בסרטונים לפי הסדר. כל שיעור בונה
          על הקודם, ותוך 14 דקות תבינו בדיוק מה לעשות.
        </p>
      </div>
    </div>
  ),
};
