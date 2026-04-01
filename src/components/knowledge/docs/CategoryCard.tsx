'use client';

import Link from 'next/link';
import { articles } from '@/lib/knowledge/articles';
import type { Category } from '@/lib/knowledge/categories';

const categoryDescriptions: Record<string, string> = {
  'system-guides': 'כל מה שצריך לדעת כדי להשתמש ב-MyNeto בצורה הטובה ביותר',
  'finance-basics': 'עקרונות פשוטים שיעזרו לכם לנהל את הכסף בצורה חכמה יותר',
  investments: 'מה צריך לדעת לפני שמשקיעים, ואיך לבנות תיק חכם',
  housing: 'מהדירה הראשונה ועד מיחזור משכנתא',
  'pension-insurance': 'הטבות מס, חיסכון לטווח ארוך וביטחון למשפחה',
  'debt-credit': 'איך להשתחרר מחובות ולהשתמש באשראי בחוכמה',
  'invest-basics': 'למה כדאי להשקיע, מה זה השקעה ואיך מתחילים',
  'invest-course': 'סדרת סרטונים שתלמד אותך מאפס ועד השקעה ראשונה',
  'invest-action': 'פתיחת חשבון מסחר והעברת תיק השקעות קיים',
  'invest-faq': 'תשובות לשאלות הכי נפוצות על השקעות',
};

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon;
  const count = articles.filter((a) => a.category === category.id).length;
  const firstArticle = articles.find((a) => a.category === category.id);
  const href = firstArticle
    ? `/knowledge/${firstArticle.slug}`
    : `/knowledge?category=${category.id}`;

  return (
    <Link
      href={href}
      className="group block p-6 bg-white rounded-3xl border border-[#F7F7F8] transition-all duration-200 hover:shadow-md hover:border-[#E8E8ED]"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: category.colorLight }}
      >
        <Icon className="w-6 h-6" style={{ color: category.color }} />
      </div>

      <h3 className="text-lg font-bold text-[#303150] mb-2 group-hover:text-[#69ADFF] transition-colors">
        {category.label}
      </h3>

      <p className="text-sm text-[#7E7F90] leading-relaxed mb-3 line-clamp-2">
        {categoryDescriptions[category.id] || ''}
      </p>

      <span className="text-xs text-[#BDBDCB]">{count} מדריכים</span>
    </Link>
  );
}
