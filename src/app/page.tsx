import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { isSafePostLoginPath } from '@/lib/safePostLoginPath';
import LandingPage from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: {
    absolute: 'MyNeto — ניהול תקציב, השקעות ותכנון פיננסי אישי | חינם',
  },
  description:
    'MyNeto היא אפליקציה חינמית לניהול הכספים: מעקב הוצאות אוטומטי עם AI, תיק השקעות, תקציב חודשי, יעדי חיסכון, דוחות חכמים ומחשבונים פיננסיים — הכל במקום אחד.',
  alternates: {
    canonical: 'https://myneto.co.il',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'האם המידע שלי מאובטח ומוגן?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'בהחלט. כל הנתונים מוצפנים בהצפנת AES-256 ומאוחסנים בשרתים מאובטחים של Neon (PostgreSQL). אנחנו לא שומרים סיסמאות בנק, לא ניגשים לחשבונות שלכם, ולא מבקשים פרטי כניסה — אתם מעלים קבצי פירוט והוצאות אשראי בלבד (Excel או CSV). ההתחברות מתבצעת דרך Google OAuth, כך שאין אצלנו סיסמה בכלל. בנוסף, שדות רגישים בפרופיל מוצפנים בנפרד.',
      },
    },
    {
      '@type': 'Question',
      name: 'איך מעלים את הנתונים למערכת?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'נכנסים לאתר חברת האשראי או לאפליקציה, מורידים את קובץ פירוט ההוצאות (Excel או CSV) — בדרך כלל מתוך תפריט "ייצוא" או "הורדת פירוט". מעלים את הקובץ ל-MyNeto, והמערכת מזהה את מבנה הקובץ אוטומטית. תוך שניות כל העסקאות מסווגות לקטגוריות בעזרת AI — מזון, דיור, תחבורה, בילויים ועוד. תומכים בכל חברות האשראי בישראל.',
      },
    },
    {
      '@type': 'Question',
      name: 'איך עובד תיק ההשקעות?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'אפשר להזין ידנית את האחזקות שלכם — מניות, קרנות סל, קרנות נאמנות, קופות גמל ופנסיה. המערכת מציגה פיזור סקטוריאלי, רמת סיכון (Beta), שינויים יומיים ושווי כולל. אתם מקבלים תמונה מלאה של התיק במקום אחד, במקום להתחבר לכמה אתרים שונים.',
      },
    },
    {
      '@type': 'Question',
      name: 'איך נבנית התכנית החודשית ליעדים?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'מגדירים יעד (דירה, חתונה, קרן חירום, חופשה — או כל דבר אחר), מזינים סכום יעד ותאריך רצוי. המערכת מחשבת כמה צריך להפריש כל חודש כדי להגיע ליעד בזמן, עם התחשבות בריבית דריבית. אפשר לעקוב אחרי ההתקדמות בזמן אמת ולהתאים את ההפרשה לפי השינויים בחיים.',
      },
    },
    {
      '@type': 'Question',
      name: 'אפשר לנהל את החשבון יחד עם בן/בת הזוג?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'כן. אפשר להזמין בני משפחה לחשבון משותף דרך מערכת ההזמנות המובנית. כולם רואים את אותו דשבורד, עוקבים אחר הוצאות, ומתכננים את היעדים ביחד. כל שינוי שמישהו עושה — מיד מתעדכן אצל כולם.',
      },
    },
    {
      '@type': 'Question',
      name: 'המערכת עובדת גם בנייד?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'כן. הממשק מותאם לחלוטין לנייד, טאבלט ומחשב. אפשר לבדוק את המצב הפיננסי, לעקוב אחרי יעדים ולהעלות קבצים מכל מכשיר, בכל מקום ובכל זמן — בלי להתקין אפליקציה.',
      },
    },
    {
      '@type': 'Question',
      name: 'זה באמת חינם? מה המודל העסקי?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'חינם לחלוטין — אין תשלומים נסתרים, אין מנוי פרימיום, ואין צורך בכרטיס אשראי. המודל העסקי של MyNeto מבוסס על הפניות לשירותי מסחר עצמאי, וזה מה שמאפשר לנו להציע את כל השירות של המערכת בחינם.',
      },
    },
  ],
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    const params = await searchParams;
    const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : null;
    const target = callbackUrl && isSafePostLoginPath(callbackUrl)
      ? callbackUrl
      : '/dashboard';
    redirect(target);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
