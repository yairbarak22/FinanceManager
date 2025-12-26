import Link from 'next/link';
import { PieChart, ArrowRight, Shield, Lock, FileCheck, Eye } from 'lucide-react';

export default function PrivacyPage() {
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
            מדיניות פרטיות
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
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Shield style={{ width: '32px', height: '32px', color: '#10B981', flexShrink: 0 }} />
            <p
              style={{
                fontSize: '16px',
                color: '#1D1D1F',
                lineHeight: 1.8,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              אנו מייחסים חשיבות עליונה לשמירה על פרטיותך ועל אבטחת הנתונים הפיננסיים שלך.
            </p>
          </div>

          {/* Section: Part B */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#2B4699',
              marginBottom: '24px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            חלק ב&apos;: מדיניות פרטיות (Privacy Policy)
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
            1. המידע שאנו אוספים
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '16px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            במסגרת השירות, נאסף מידע אישי ופיננסי הכולל:
          </p>
          <ul
            style={{
              paddingRight: '20px',
              marginBottom: '24px',
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
              פרטי זיהוי (שם, אימייל).
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
              נתוני פרופיל (מצב משפחתי, שירות צבאי, רמת הכנסה, טווח גילאים) המשמשים להתאמת תובנות פיננסיות.
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
              נתוני תנועות, נכסים, הלוואות והתחייבויות.
            </li>
            <li
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.8,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              מסמכים המועלים על ידי המשתמש (PDF, תמונות, קובצי אופיס).
            </li>
          </ul>

          {/* Section 2 */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '16px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            2. אבטחת מסמכים ומידע – התחייבות לאי-זליגה
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '16px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            אנו מפעילים אמצעי הגנה מתקדמים ביותר כדי להבטיח ששום מסמך שהעלית לא יזלוג לגורמים לא מורשים:
          </p>

          {/* Security Features Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Feature 1 */}
            <div
              style={{
                backgroundColor: 'rgba(43, 70, 153, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '12px',
              }}
            >
              <Lock style={{ width: '24px', height: '24px', color: '#2B4699', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  אחסון מאובטח
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  מסמכים מאוחסנים בשירותי ענן מאובטחים (Vercel Blob) עם שמות קבצים מוצפנים וייחודיים (UUID) המונעים גישה אקראית או ניחוש כתובות.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                backgroundColor: 'rgba(43, 70, 153, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '12px',
              }}
            >
              <Shield style={{ width: '24px', height: '24px', color: '#2B4699', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  הפרדת הרשאות
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  הגישה למסמכים מוגבלת אך ורק למשתמש שהעלה אותם (או למשתמשים שהורשו במפורש בחשבון משותף) באמצעות מנגנוני אימות קשיחים ברמת השרת.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                backgroundColor: 'rgba(43, 70, 153, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '12px',
              }}
            >
              <Eye style={{ width: '24px', height: '24px', color: '#2B4699', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  פרוקסי מאובטח
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  הורדת מסמכים מתבצעת דרך שרת מאובטח המאמת את זהות המשתמש בכל פעם מחדש, ואינה חשופה בקישור ציבורי ישיר.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div
              style={{
                backgroundColor: 'rgba(43, 70, 153, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '12px',
              }}
            >
              <FileCheck style={{ width: '24px', height: '24px', color: '#2B4699', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  סניטציה של קבצים
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  כל קובץ המועלה למערכת עובר תהליך בדיקה וניקוי (Sanitization) כדי למנוע הזרקת קוד עוין והגנה על שלמות המערכת.
                </p>
              </div>
            </div>
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
            3. השימוש במידע
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: '16px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            המידע משמש אך ורק למטרות הבאות:
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
              תפעול האפליקציה והצגת המידע הפיננסי למשתמש.
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
              יצירת המלצות ותובנות באמצעות ה-&quot;Advisor Engine&quot;.
            </li>
            <li
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.8,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              שיפור מנגנון סיווג העסקאות האוטומטי (Merchant Category Mapping) לטובת המשתמש.
            </li>
          </ul>
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                color: '#10B981',
                fontWeight: 600,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              איננו מוכרים, משכירים או מעבירים מידע אישי ופיננסי של משתמשים לצדדים שלישיים למטרות שיווקיות.
            </p>
          </div>

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
            4. זכויות המשתמש
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
            המשתמש רשאי בכל עת לעיין במידע שנאסף עליו, לתקנו או לבקש את מחיקת חשבונו לצמיתות. עם מחיקת החשבון, כל המידע והמסמכים המשויכים אליו יימחקו מבסיסי הנתונים שלנו (בכפוף לדרישות חוקיות לשמירת מידע במידה וקיימות).
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

          {/* Link to Terms */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: '24px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Link
              href="/terms"
              style={{
                color: '#2B4699',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              קרא גם: תנאי שימוש ←
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

