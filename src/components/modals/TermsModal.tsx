'use client';

import { X, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                className="modal-content max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">תנאי שימוש ומדיניות פרטיות</h3>
                            <p className="text-xs text-slate-500">MyNeto – עדכון אחרון: דצמבר 2024</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
                        <p className="text-sm leading-relaxed">
                            ברוכים הבאים ל-MyNeto. השימוש באפליקציה, באתר ובשירותים הנלווים להם כפוף לתנאים המפורטים להלן.
                            בעצם ההרשמה לשירות או השימוש בו, הנך מצהיר כי קראת, הבנת ואתה מסכים לכל התנאים המפורטים במסמך זה.
                        </p>

                        {/* חלק א' */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h2 className="text-base font-bold text-slate-900 mb-3">חלק א': תנאי שימוש (Terms of Service)</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">1. מהות השירות</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        האפליקציה הינה כלי טכנולוגי לניהול, מעקב וריכוז נתונים פיננסיים אישיים.
                                        השירות כולל מערכת ניתוח מבוססת כללים ("Advisor Engine") המציעה תובנות המבוססות על הנתונים שהוזנו על ידי המשתמש.
                                    </p>
                                </div>

                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                                    <h3 className="text-sm font-semibold text-rose-900 mb-2">2. הבהרה משפטית קריטית – העדר ייעוץ השקעות</h3>
                                    <p className="text-sm text-rose-800 leading-relaxed mb-2 font-medium">לתשומת לבך:</p>
                                    <p className="text-sm text-rose-800 leading-relaxed mb-2">
                                        המידע, התובנות, ה"המלצות" והניתוחים המופקים על ידי האפליקציה (לרבות באמצעות מנוע הייעוץ או ה-AI) אינם מהווים בשום אופן:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-rose-800 space-y-1 mr-4">
                                        <li>ייעוץ השקעות או שיווק השקעות כהגדרתם בחוק הסדרת העיסוק בייעוץ השקעות, בשיווק השקעות ובניהול תיקי השקעות, תשנ"ה-1995</li>
                                        <li>ייעוץ מס, ייעוץ פנסיוני או ייעוץ משפטי</li>
                                        <li>תחליף לשיקול דעת עצמאי או לייעוץ מקצועי המותאם אישית לנסיבותיו הספציפיות של המשתמש</li>
                                    </ul>
                                    <p className="text-sm text-rose-800 leading-relaxed mt-2">
                                        השימוש בכל מידע המופק מהאפליקציה הינו על אחריותו הבלעדית של המשתמש.
                                        המפעיל אינו נושא באחריות לכל נזק, הפסד או אובדן רווח שייגרם למשתמש כתוצאה מהסתמכות על המידע באפליקציה.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">3. אחריות המשתמש</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        המשתמש אחראי לדיוק הנתונים המוזנים לאפליקציה (עסקאות, נכסים, התחייבויות).
                                        תוצרי המערכת תלויים לחלוטין בנכונות המידע שהמשתמש סיפק.
                                        המשתמש מתחייב לשמור על סודיות פרטי הגישה לחשבונו.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">4. חשבונות משותפים</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        האפליקציה מאפשרת שיתוף חשבונות בין משתמשים (Shared Accounts).
                                        מובהר כי המשתמש המזמין צד ג' לחשבונו חושף בפניו את מלוא המידע הפיננסי והמסמכים המצויים באותו חשבון,
                                        והמפעיל לא יהיה אחראי לכל דליפת מידע הנובעת משיתוף פעולה זה.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* חלק ב' */}
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <h2 className="text-base font-bold text-slate-900 mb-3">חלק ב': מדיניות פרטיות (Privacy Policy)</h2>
                            <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                אנו מייחסים חשיבות עליונה לשמירה על פרטיותך ועל אבטחת הנתונים הפיננסיים שלך.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">1. המידע שאנו אוספים</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed mb-2">במסגרת השירות, נאסף מידע אישי ופ

                                        יננסי הכולל:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mr-4">
                                        <li>פרטי זיהוי (שם, אימייל)</li>
                                        <li>נתוני פרופיל (מצב משפחתי, שירות צבאי, רמת הכנסה, טווח גילאים)</li>
                                        <li>נתוני תנועות, נכסים, הלוואות והתחייבויות</li>
                                        <li>מסמכים המועלים על ידי המשתמש (PDF, תמונות, קובצי אופיס)</li>
                                    </ul>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <h3 className="text-sm font-semibold text-green-900 mb-2">2. אבטחת מסמכים ומידע – התחייבות לאי-זליגה</h3>
                                    <p className="text-sm text-green-800 leading-relaxed mb-2">
                                        אנו מפעילים אמצעי הגנה מתקדמים ביותר כדי להבטיח ששום מסמך שהעלית לא יזלוג לגורמים לא מורשים:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-green-800 space-y-1 mr-4">
                                        <li><strong>אחסון מאובטח:</strong> שירותי ענן (Vercel Blob) עם UUID מוצפן</li>
                                        <li><strong>הפרדת הרשאות:</strong> גישה מוגבלת למשתמש המעלה בלבד</li>
                                        <li><strong>פרוקסי מאובטח:</strong> אימות זהות בכל הורדה</li>
                                        <li><strong>סניטציה:</strong> כל קובץ עובר בדיקה ומניעת קוד עוין</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">3. השימוש במידע</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed mb-2">המידע משמש אך ורק למטרות הבאות:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mr-4">
                                        <li>תפעול האפליקציה והצגת המידע הפיננסי</li>
                                        <li>יצירת המלצות ותובנות באמצעות ה-Advisor Engine</li>
                                        <li>שיפור מנגנון סיווג עסקאות אוטומטי</li>
                                    </ul>
                                    <p className="text-sm text-slate-700 leading-relaxed mt-2 font-medium">
                                        איננו מוכרים, משכירים או מעבירים מידע אישי לצדדים שלישיים למטרות שיווקיות.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-2">4. זכויות המשתמש</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        המשתמש רשאי בכל עת לעיין במידע שנאסף עליו, לתקנו או לבקש את מחיקת חשבונו לצמיתות.
                                        עם מחיקת החשבון, כל המידע והמסמכים יימחקו מבסיסי הנתונים (בכפוף לדרישות חוקיות).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* הגבלת אחריות */}
                        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                            <h2 className="text-base font-bold text-slate-900 mb-2">הגבלת אחריות וסמכות שיפוט</h2>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                המפעיל לא יהיה אחראי לכל נזק עקיף, תוצאתי או מקרי הנובע מהשימוש בשירות.
                                על הסכם זה יחלו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-t border-gray-100 flex-shrink-0">
                    <button onClick={onClose} className="btn-primary w-full">
                        הבנתי ואני מסכים
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
