import Link from 'next/link';
import { PieChart, ArrowRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 15%, #EAF3FC 30%, #E4F0FB 45%, #DEEDF9 60%, #D8EAF8 75%, #D2E7F6 90%, #CCE4F5 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Glow Effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px',
        }}
      >
        {/* Glassmorphism Card */}
        <div
          style={{
            maxWidth: '800px',
            width: '100%',
            padding: '48px',
            borderRadius: '32px',
            direction: 'rtl',
            background: 'rgba(255, 255, 255, 0.50)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header with Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Logo */}
            <Link
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0px',
                textDecoration: 'none',
              }}
            >
              <PieChart
                style={{
                  width: '40px',
                  height: '40px',
                  color: '#2B4699',
                  marginLeft: '-2px',
                }}
                strokeWidth={3}
              />
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  color: '#1D1D1F',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                NET
              </span>
            </Link>

            {/* Back Button */}
            <Link
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: '#2B4699',
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-heebo), sans-serif',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowRight style={{ width: '16px', height: '16px' }} />
              חזרה לכניסה
            </Link>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1D1D1F',
              marginBottom: '8px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            תנאי שימוש
          </h1>

          {/* Update Date */}
          <p
            style={{
              fontSize: '14px',
              color: '#86868b',
              marginBottom: '32px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            עדכון אחרון: דצמבר 2024
          </p>

          {/* Intro */}
          <p
            style={{
              fontSize: '16px',
              color: '#1D1D1F',
              lineHeight: 1.8,
              marginBottom: '32px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            ברוכים הבאים ל-MyNeto. השימוש באפליקציה, באתר ובשירותים הנלווים להם כפוף לתנאים המפורטים להלן. בעצם ההרשמה לשירות או השימוש בו, הנך מצהיר כי קראת, הבנת ואתה מסכים לכל התנאים המפורטים במסמך זה.
          </p>

          {/* Section: Part A */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#2B4699',
              marginBottom: '24px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            חלק א&apos;: תנאי שימוש (Terms of Service)
          </h2>

          {/* Section 1 */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '12px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            1. מהות השירות
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '24px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            האפליקציה הינה כלי טכנולוגי לניהול, מעקב וריכוז נתונים פיננסיים אישיים. השירות כולל מערכת ניתוח מבוססת כללים (&quot;Advisor Engine&quot;) המציעה תובנות המבוססות על הנתונים שהוזנו על ידי המשתמש.
          </p>

          {/* Section 2 */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '12px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            2. הבהרה משפטית קריטית – העדר ייעוץ השקעות (Investment Advice Disclaimer)
          </h3>
          <div
            style={{
              backgroundColor: 'rgba(254, 242, 242, 0.7)',
              border: '1px solid rgba(254, 202, 202, 0.8)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                color: '#DC2626',
                lineHeight: 1.8,
                marginBottom: '16px',
                fontWeight: 600,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              לתשומת לבך: המידע, התובנות, ה&quot;המלצות&quot; והניתוחים המופקים על ידי האפליקציה (לרבות באמצעות מנוע הייעוץ או ה-AI) אינם מהווים בשום אופן:
            </p>
            <ul
              style={{
                paddingRight: '20px',
                marginBottom: '16px',
              }}
            >
              <li
                style={{
                  fontSize: '15px',
                  color: '#475569',
                  lineHeight: 1.8,
                  marginBottom: '8px',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                ייעוץ השקעות או שיווק השקעות כהגדרתם בחוק הסדרת העיסוק בייעוץ השקעות, בשיווק השקעות ובניהול תיקי השקעות, תשנ&quot;ה-1995.
              </li>
              <li
                style={{
                  fontSize: '15px',
                  color: '#475569',
                  lineHeight: 1.8,
                  marginBottom: '8px',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                ייעוץ מס, ייעוץ פנסיוני או ייעוץ משפטי.
              </li>
              <li
                style={{
                  fontSize: '15px',
                  color: '#475569',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                תחליף לשיקול דעת עצמאי או לייעוץ מקצועי המותאם אישית לנסיבותיו הספציפיות של המשתמש על ידי איש מקצוע מוסמך.
              </li>
            </ul>
            <p
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.8,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              השימוש בכל מידע המופק מהאפליקציה הינו על אחריותו הבלעדית של המשתמש. המפעיל אינו נושא באחריות לכל נזק, הפסד או אובדן רווח שייגרם למשתמש כתוצאה מהסתמכות על המידע באפליקציה.
            </p>
          </div>

          {/* Section 3 */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '12px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            3. אחריות המשתמש
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '24px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            המשתמש אחראי לדיוק הנתונים המוזנים לאפליקציה (עסקאות, נכסים, התחייבויות). תוצרי המערכת תלויים לחלוטין בנכונות המידע שהמשתמש סיפק. המשתמש מתחייב לשמור על סודיות פרטי הגישה לחשבונו.
          </p>

          {/* Section 4 */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '12px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            4. חשבונות משותפים
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '32px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            האפליקציה מאפשרת שיתוף חשבונות בין משתמשים (Shared Accounts). מובהר כי המשתמש המזמין צד ג&apos; לחשבונו חושף בפניו את מלוא המידע הפיננסי והמסמכים המצויים באותו חשבון, והמפעיל לא יהיה אחראי לכל דליפת מידע הנובעת משיתוף פעולה זה.
          </p>

          {/* Limitation of Liability */}
          <div
            style={{
              backgroundColor: 'rgba(43, 70, 153, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#2B4699',
                marginBottom: '12px',
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              הגבלת אחריות וסמכות שיפוט
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.8,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              המפעיל לא יהיה אחראי לכל נזק עקיף, תוצאתי או מקרי הנובע מהשימוש בשירות. על הסכם זה יחלו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב.
            </p>
          </div>

          {/* Link to Privacy */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: '24px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Link
              href="/privacy"
              style={{
                color: '#2B4699',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              קרא גם: מדיניות פרטיות ←
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*='maxWidth: \\'800px\\''] {
            padding: 32px 24px !important;
          }
          h1 {
            font-size: 26px !important;
          }
          h2 {
            font-size: 20px !important;
          }
          h3 {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

