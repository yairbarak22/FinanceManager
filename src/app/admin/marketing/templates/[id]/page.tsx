'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, AlertCircle, FileText, Calendar, Smartphone, Monitor } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import { categoryLabels } from '@/lib/marketing/defaultTemplates';
import EmailPreview from '@/components/admin/EmailPreview';

interface Template {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  category: string | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function TemplateDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchTemplate();
  }, [session, status, router, templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/admin/marketing/templates/${templateId}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError('תבנית לא נמצאה');
        } else if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לצפות בתבנית זו');
        } else {
          setError('שגיאה בטעינת התבנית');
        }
        return;
      }

      const data = await res.json();
      setTemplate(data.template);
    } catch {
      setError('שגיאה בטעינת התבנית');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את התבנית "${template?.name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/marketing/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה במחיקת התבנית');
        return;
      }

      router.push('/admin/marketing/templates');
    } catch {
      alert('שגיאה במחיקת התבנית');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (error || !template) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90] mb-6">{error || 'תבנית לא נמצאה'}</p>
          <button
            onClick={() => router.push('/admin/marketing/templates')}
            className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
          >
            חזור לתבניות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/marketing/templates')}
            className="p-2 hover:bg-[#F7F7F8] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#7E7F90]" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-bold text-[#303150]">{template.name}</h1>
              {template.isSystem && (
                <span className="px-2 py-0.5 bg-[#0DBACC]/10 text-[#0DBACC] text-[10px] sm:text-xs font-medium rounded-lg">
                  מערכת
                </span>
              )}
            </div>
            <p className="text-xs lg:text-sm text-[#7E7F90]">פרטי תבנית</p>
          </div>
        </div>
        {!template.isSystem && (
          <div className="flex items-center gap-2 sm:gap-3 mr-11 sm:mr-0">
            <button
              onClick={() => router.push(`/admin/marketing/templates/${templateId}/edit`)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-xs sm:text-sm"
            >
              <Edit className="w-4 h-4" />
              עריכה
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#F18AB5]/10 text-[#F18AB5] rounded-xl hover:bg-[#F18AB5]/20 transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Template Info */}
        <div className="lg:col-span-1 bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <h2 className="text-base lg:text-lg font-bold text-[#303150] mb-3 lg:mb-4">פרטי התבנית</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">שם</p>
              <p className="text-base font-medium text-[#303150]">{template.name}</p>
            </div>
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">נושא</p>
              <p className="text-base font-medium text-[#303150]">{template.subject}</p>
            </div>
            {template.category && (
              <div>
                <p className="text-sm text-[#7E7F90] mb-1">קטגוריה</p>
                <span className="inline-block px-3 py-1 bg-[#69ADFF]/10 text-[#69ADFF] text-xs font-semibold rounded-lg">
                  {categoryLabels[template.category] || template.category}
                </span>
              </div>
            )}
            {template.description && (
              <div>
                <p className="text-sm text-[#7E7F90] mb-1">תיאור</p>
                <p className="text-base font-medium text-[#303150]">{template.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">נוצר על ידי</p>
              <p className="text-base font-medium text-[#303150]">
                {template.creator.name || template.creator.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">תאריך יצירה</p>
              <p className="text-base font-medium text-[#303150]">{formatDate(template.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">עודכן לאחרונה</p>
              <p className="text-base font-medium text-[#303150]">{formatDate(template.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[#F7F7F8]">
            <h2 className="text-base lg:text-lg font-bold text-[#303150]">תצוגה מקדימה</h2>
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-md transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-white shadow-sm text-[#69ADFF]'
                    : 'text-[#7E7F90] hover:text-[#303150]'
                }`}
                title="תצוגת מחשב"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-md transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-white shadow-sm text-[#69ADFF]'
                    : 'text-[#7E7F90] hover:text-[#303150]'
                }`}
                title="תצוגת נייד"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Email header preview */}
          <div className="mx-4 lg:mx-6 mt-3 lg:mt-4 p-3 bg-[#F5F5F7] rounded-xl">
            <p className="text-xs text-[#7E7F90] mb-1">מאת: myneto &lt;admin@myneto.co.il&gt;</p>
            <p className="text-sm font-semibold text-[#303150]">{template.subject}</p>
          </div>
          <div className="p-4 lg:p-6 flex justify-center">
            <EmailPreview
              htmlContent={template.content}
              previewMode={previewMode}
              maxHeight="600px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

