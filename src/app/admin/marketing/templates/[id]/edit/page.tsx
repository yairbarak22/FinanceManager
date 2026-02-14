'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Monitor,
  Layout,
  ChevronDown,
  Info,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import {
  categoryLabels,
  templateVariables,
} from '@/lib/marketing/defaultTemplates';
import EmailPreview from '@/components/admin/EmailPreview';

interface SystemTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  description: string | null;
  category: string | null;
}

export default function EditTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isSystem, setIsSystem] = useState(false);

  // Template selector
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Preview mode
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showVariableHelp, setShowVariableHelp] = useState(false);

  const fetchSystemTemplates = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/marketing/templates');
      if (res.ok) {
        const data = await res.json();
        setSystemTemplates(
          (data.templates || []).filter((t: SystemTemplate & { isSystem: boolean }) => t.isSystem)
        );
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchTemplate();
    fetchSystemTemplates();
  }, [session, status, router, templateId, fetchSystemTemplates]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/admin/marketing/templates/${templateId}`);

      if (!res.ok) {
        if (res.status === 404) setError('תבנית לא נמצאה');
        else if (res.status === 403 || res.status === 401) setError('אין לך הרשאה לערוך תבנית זו');
        else setError('שגיאה בטעינת התבנית');
        return;
      }

      const data = await res.json();
      const template = data.template;
      setName(template.name);
      setSubject(template.subject);
      setDescription(template.description || '');
      setContent(template.content);
      setCategory(template.category || '');
      setIsSystem(template.isSystem);

      if (template.isSystem) {
        setError('לא ניתן לערוך תבניות מערכת. ניתן לשכפל אותה כתבנית חדשה.');
      }
    } catch {
      setError('שגיאה בטעינת התבנית');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (template: SystemTemplate) => {
    setContent(template.content);
    setShowTemplateSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSystem) {
      setError('לא ניתן לערוך תבניות מערכת');
      return;
    }

    if (!name || !subject || !content) {
      setError('נא למלא את כל השדות החובה');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/admin/marketing/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          description: description || null,
          content,
          category: category || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בעדכון התבנית');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/marketing/templates/${templateId}`);
      }, 2000);
    } catch {
      setError('שגיאה בעדכון התבנית');
    } finally {
      setSaving(false);
    }
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="w-16 h-16 bg-[#0DBACC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#0DBACC]" />
          </div>
          <h2 className="text-2xl font-bold text-[#303150] mb-2">התבנית עודכנה בהצלחה!</h2>
          <p className="text-[#7E7F90]">מעביר לדף התבנית...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/marketing/templates/${templateId}`)}
            className="p-2 hover:bg-[#F7F7F8] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#7E7F90]" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">עריכת תבנית</h1>
            <p className="text-xs lg:text-sm text-[#7E7F90]">ערוך תבנית מייל</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mr-11 sm:mr-0">
          <button
            type="button"
            onClick={() => router.push(`/admin/marketing/templates/${templateId}`)}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-xs sm:text-sm"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name || !subject || !content || isSystem}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">שמור שינויים</span>
                <span className="sm:hidden">שמור</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0" />
          <p className="text-sm text-[#303150]">{error}</p>
        </div>
      )}

      {/* Template Selector */}
      {!isSystem && systemTemplates.length > 0 && (
        <div className="mb-6 relative">
          <button
            type="button"
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#E8E8ED] hover:border-[#69ADFF] transition-colors text-sm text-[#7E7F90]"
          >
            <Layout className="w-4 h-4" />
            טען תוכן מתבנית מוכנה
            <ChevronDown className={`w-4 h-4 transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
          </button>
          {showTemplateSelector && (
            <div className="absolute top-12 right-0 z-20 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#E8E8ED] p-2 min-w-[280px]">
              {systemTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleLoadTemplate(template)}
                  className="w-full px-4 py-3 text-right rounded-lg hover:bg-[#F5F5F7] transition-colors"
                >
                  <p className="text-sm font-medium text-[#303150]">{template.name}</p>
                  <p className="text-xs text-[#7E7F90] line-clamp-1">{template.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Details Card */}
        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-bold text-[#303150] mb-3 lg:mb-4">פרטי התבנית</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-[#7E7F90] mb-1.5">שם התבנית *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="למשל: ניוזלטר חודשי"
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm"
                required
                disabled={isSystem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7E7F90] mb-1.5">נושא המייל *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="נושא שיופיע בתיבת הדואר"
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm"
                required
                disabled={isSystem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7E7F90] mb-1.5">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm appearance-none cursor-pointer bg-white"
                disabled={isSystem}
              >
                <option value="">ללא קטגוריה</option>
                <option value="newsletter">ניוזלטר</option>
                <option value="promotional">שיווקי</option>
                <option value="announcement">הודעה</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7E7F90] mb-1.5">תיאור (אופציונלי)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור קצר..."
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm"
                disabled={isSystem}
              />
            </div>
          </div>
        </div>

        {/* Split-Screen Editor + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* HTML Editor */}
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col min-h-[400px] lg:min-h-[600px]">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[#F7F7F8]">
              <h2 className="text-base font-bold text-[#303150]">עורך HTML</h2>
              <button
                type="button"
                onClick={() => setShowVariableHelp(!showVariableHelp)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#7E7F90] hover:text-[#69ADFF] hover:bg-[#F5F5F7] rounded-lg transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                משתנים
              </button>
            </div>

            {showVariableHelp && (
              <div className="mx-6 mt-4 p-4 bg-[#F5F5F7] rounded-xl">
                <p className="text-xs font-semibold text-[#303150] mb-2">משתנים זמינים:</p>
                <div className="space-y-1.5">
                  {templateVariables.map((v) => (
                    <div key={v.name} className="flex items-center gap-2">
                      <code className="text-xs bg-white px-2 py-0.5 rounded-md text-[#69ADFF] font-mono">
                        {v.name}
                      </code>
                      <span className="text-xs text-[#7E7F90]">{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 p-4 lg:p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="הכנס כאן את תוכן התבנית ב-HTML..."
                className="w-full h-full min-h-[300px] lg:min-h-[450px] px-3 lg:px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent font-mono text-[11px] lg:text-xs leading-relaxed resize-none"
                required
                disabled={isSystem}
                dir="ltr"
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col min-h-[400px] lg:min-h-[600px]">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[#F7F7F8]">
              <h2 className="text-base font-bold text-[#303150]">תצוגה מקדימה</h2>
              <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-lg p-1">
                <button
                  type="button"
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
                  type="button"
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

            {subject && (
              <div className="mx-6 mt-4 p-3 bg-[#F5F5F7] rounded-xl">
                <p className="text-xs text-[#7E7F90] mb-1">מאת: myneto &lt;admin@myneto.co.il&gt;</p>
                <p className="text-sm font-semibold text-[#303150]">{subject}</p>
              </div>
            )}

            <div className="flex-1 p-4 lg:p-6 flex justify-center">
              {content ? (
                <EmailPreview
                  htmlContent={content}
                  previewMode={previewMode}
                  maxHeight="500px"
                />
              ) : (
                <div className="w-full border border-[#E8E8ED] rounded-xl p-12 bg-[#F7F7F8] text-center flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-[#BDBDCB] mx-auto mb-3" />
                  <p className="text-sm text-[#7E7F90]">התצוגה המקדימה תופיע כאן</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
