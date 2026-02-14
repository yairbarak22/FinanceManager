'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Download,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import { categoryLabels } from '@/lib/marketing/defaultTemplates';
import MiniEmailPreview from '@/components/admin/MiniEmailPreview';

interface Template {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  category: string | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
}

const ALL_CATEGORIES = [
  { value: '', label: 'הכל' },
  { value: 'newsletter', label: 'ניוזלטר' },
  { value: 'promotional', label: 'שיווקי' },
  { value: 'announcement', label: 'הודעה' },
];

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultsMessage, setDefaultsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchTemplates();
  }, [session, status, router]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/marketing/templates');

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לצפות בדף זה');
        } else {
          setError('שגיאה בטעינת התבניות');
        }
        return;
      }

      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setError('שגיאה בטעינת התבניות');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/marketing/templates/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('שגיאה במחיקת התבנית');
        return;
      }

      fetchTemplates();
    } catch {
      setError('שגיאה במחיקת התבנית');
    }
  };

  const handleLoadDefaults = async () => {
    setLoadingDefaults(true);
    setDefaultsMessage(null);
    try {
      const res = await apiFetch('/api/admin/marketing/templates/init', {
        method: 'POST',
      });

      if (!res.ok) {
        setDefaultsMessage('שגיאה בטעינת תבניות ברירת מחדל');
        return;
      }

      const data = await res.json();
      setDefaultsMessage(data.message);
      fetchTemplates();
    } catch {
      setDefaultsMessage('שגיאה בטעינת תבניות ברירת מחדל');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const filteredTemplates = activeCategory
    ? templates.filter((t) => t.category === activeCategory)
    : templates;

  const hasSystemTemplates = templates.some((t) => t.isSystem);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <FileText className="w-8 h-8 text-[#69ADFF] animate-pulse" />
          </div>
          <p className="text-[#7E7F90]">טוען...</p>
        </div>
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">תבניות</h1>
          <p className="text-xs lg:text-sm text-[#7E7F90]">
            ניהול תבניות מייל &middot; {templates.length} תבניות
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!hasSystemTemplates && (
            <button
              onClick={handleLoadDefaults}
              disabled={loadingDefaults}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#0DBACC]/10 text-[#0DBACC] rounded-xl hover:bg-[#0DBACC]/20 transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              {loadingDefaults ? (
                <div className="w-4 h-4 border-2 border-[#0DBACC] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">טען תבניות מוכנות</span>
              <span className="sm:hidden">טען</span>
            </button>
          )}
          <button
            onClick={() => router.push('/admin/marketing/templates/new')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">תבנית חדשה</span>
            <span className="sm:hidden">חדשה</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0" />
          <p className="text-sm text-[#303150]">{error}</p>
        </div>
      )}
      {defaultsMessage && (
        <div className="mb-6 bg-[#0DBACC]/10 border border-[#0DBACC]/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#0DBACC] flex-shrink-0" />
          <p className="text-sm text-[#303150]">{defaultsMessage}</p>
        </div>
      )}

      {/* Category Filters */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          <Filter className="w-4 h-4 text-[#7E7F90] flex-shrink-0" />
          {ALL_CATEGORIES.map((cat) => {
            const count = cat.value
              ? templates.filter((t) => t.category === cat.value).length
              : templates.length;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeCategory === cat.value
                    ? 'bg-[#69ADFF] text-white'
                    : 'bg-white text-[#7E7F90] hover:bg-[#F7F7F8] border border-[#E8E8ED]'
                }`}
              >
                {cat.label}
                {count > 0 && (
                  <span className={`mr-1 sm:mr-1.5 text-[10px] sm:text-xs ${
                    activeCategory === cat.value ? 'text-white/80' : 'text-[#BDBDCB]'
                  }`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 && templates.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-12 text-center">
          <div className="w-16 h-16 bg-[#69ADFF]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#69ADFF]" />
          </div>
          <h3 className="text-lg font-bold text-[#303150] mb-2">אין תבניות עדיין</h3>
          <p className="text-[#7E7F90] mb-6 max-w-md mx-auto">
            התחל על ידי טעינת תבניות מוכנות מראש, או צור תבנית חדשה משלך
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleLoadDefaults}
              disabled={loadingDefaults}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0DBACC] text-white rounded-xl hover:bg-[#0DBACC]/90 transition-colors disabled:opacity-50"
            >
              {loadingDefaults ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              טען תבניות מוכנות
            </button>
            <button
              onClick={() => router.push('/admin/marketing/templates/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
            >
              <Plus className="w-5 h-5" />
              צור תבנית
            </button>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-12 text-center">
          <FileText className="w-12 h-12 text-[#BDBDCB] mx-auto mb-4" />
          <p className="text-[#7E7F90]">
            אין תבניות בקטגוריה &quot;{categoryLabels[activeCategory] || activeCategory}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow group"
            >
              {/* Mini Preview */}
              <div className="h-[140px] bg-[#F5F5F7] overflow-hidden relative border-b border-[#F7F7F8]">
                {template.content ? (
                  <MiniEmailPreview htmlContent={template.content} height={140} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="w-8 h-8 text-[#BDBDCB]" />
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-[#303150]/0 group-hover:bg-[#303150]/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => router.push(`/admin/marketing/templates/${template.id}`)}
                    className="px-4 py-2 bg-white text-[#303150] rounded-xl text-sm font-medium shadow-lg"
                  >
                    <Eye className="w-4 h-4 inline-block ml-1" />
                    צפייה
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[#303150] truncate">
                      {template.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mr-2">
                    {template.isSystem && (
                      <span className="px-2 py-0.5 bg-[#0DBACC]/10 text-[#0DBACC] text-[10px] font-semibold rounded-lg">
                        מערכת
                      </span>
                    )}
                    {template.category && (
                      <span className="px-2 py-0.5 bg-[#69ADFF]/10 text-[#69ADFF] text-[10px] font-semibold rounded-lg">
                        {categoryLabels[template.category] || template.category}
                      </span>
                    )}
                  </div>
                </div>

                {template.description && (
                  <p className="text-xs text-[#7E7F90] mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <p className="text-xs text-[#BDBDCB] mb-3">
                  נושא: {template.subject}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/marketing/templates/${template.id}`)}
                    className="flex-1 px-3 py-2 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-xs font-medium text-center"
                  >
                    <Eye className="w-3.5 h-3.5 inline-block ml-1" />
                    צפייה
                  </button>
                  {!template.isSystem && (
                    <>
                      <button
                        onClick={() => router.push(`/admin/marketing/templates/${template.id}/edit`)}
                        className="px-3 py-2 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors"
                        title="עריכה"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-2 bg-[#F18AB5]/10 text-[#F18AB5] rounded-xl hover:bg-[#F18AB5]/20 transition-colors"
                        title="מחיקה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load Defaults Button at Bottom (when system templates don't exist) */}
      {templates.length > 0 && !hasSystemTemplates && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadDefaults}
            disabled={loadingDefaults}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F7F7F8] text-[#7E7F90] rounded-xl hover:bg-[#E8E8ED] transition-colors mx-auto text-sm"
          >
            {loadingDefaults ? (
              <div className="w-4 h-4 border-2 border-[#7E7F90] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            טען תבניות מוכנות מראש
          </button>
        </div>
      )}
    </div>
  );
}
