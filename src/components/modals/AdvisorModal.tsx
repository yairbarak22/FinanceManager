'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Lightbulb,
  Receipt,
  PiggyBank,
  Shield,
  Landmark,
  Info,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, apiFetch } from '@/lib/utils';
import HelpTrigger from '@/components/ai/HelpTrigger';

// Types matching the backend
type RecommendationType = 'tax_benefit' | 'savings' | 'insurance' | 'banking' | 'general';
type RecommendationPriority = 'high' | 'medium' | 'low';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  actionUrl?: string;
  potentialValue?: number;
  eligibilityReason?: string;
}

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icons for each recommendation type
const TYPE_ICONS: Record<RecommendationType, React.ReactNode> = {
  tax_benefit: <Receipt className="w-5 h-5" />,
  savings: <PiggyBank className="w-5 h-5" />,
  insurance: <Shield className="w-5 h-5" />,
  banking: <Landmark className="w-5 h-5" />,
  general: <Info className="w-5 h-5" />,
};

// Colors for each type - Blue-Purple spectrum matching brand
const TYPE_COLORS: Record<RecommendationType, string> = {
  tax_benefit: 'bg-indigo-50 text-indigo-600',      // Deep blue for tax
  savings: 'bg-blue-50 text-blue-600',               // Primary blue for savings
  insurance: 'bg-purple-50 text-purple-600',         // Purple for insurance
  banking: 'bg-violet-50 text-violet-600',           // Violet for banking  
  general: 'bg-slate-50 text-slate-600',             // Neutral slate
};

// Priority badge styles - Brand colors
const PRIORITY_STYLES: Record<RecommendationPriority, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
};

// Priority labels in Hebrew
const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  high: 'עדיפות גבוהה',
  medium: 'עדיפות בינונית',
  low: 'עדיפות נמוכה',
};

// Type labels in Hebrew
const TYPE_LABELS: Record<RecommendationType, string> = {
  tax_benefit: 'הטבת מס',
  savings: 'חיסכון',
  insurance: 'ביטוח',
  banking: 'בנקאות',
  general: 'כללי',
};

export default function AdvisorModal({ isOpen, onClose }: AdvisorModalProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('שגיאה בטעינת ההמלצות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecommendations();
    }
  }, [isOpen, fetchRecommendations]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(135deg, #2B4699 0%, #7C3AED 100%)'
            }}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">המלצות פיננסיות</h3>
              <p className="text-xs text-slate-500">הטבות ופעולות מומלצות עבורך</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500">מנתח את הנתונים הפיננסיים שלך...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="btn-primary"
              >
                נסה שוב
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-2">מצוין!</h4>
              <p className="text-slate-500 text-center max-w-sm">
                לא מצאנו כרגע הטבות או פעולות שמתאימות לך.
                המשך לעדכן את הנתונים ונמשיך לחפש הזדמנויות עבורך.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer border-t border-gray-100">
          <p className="text-xs text-slate-400 flex-1">
            ההמלצות מבוססות על הנתונים שהזנת ואינן מהוות ייעוץ פיננסי מקצועי
          </p>
          <button onClick={onClose} className="btn-secondary">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual recommendation card
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { title, description, type, priority, actionUrl, potentialValue, eligibilityReason } = recommendation;

  // Build context data for AI help
  const contextData = {
    כותרת: title,
    תיאור: description,
    סוג_המלצה: TYPE_LABELS[type],
    עדיפות: PRIORITY_LABELS[priority],
    ...(potentialValue && { ערך_כספי_משוער: potentialValue }),
    ...(eligibilityReason && { סיבת_זכאות: eligibilityReason }),
    ...(actionUrl && { קישור_למידע: actionUrl }),
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[type]}`}>
          {TYPE_ICONS[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-900">{title}</h4>
              <HelpTrigger
                contextDescription={`המלצה פיננסית: ${title}`}
                contextData={contextData}
                topicId="recommendation"
                size="sm"
              />
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_STYLES[priority]}`}>
              {PRIORITY_LABELS[priority]}
            </span>
          </div>

          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center justify-between">
            {/* Potential value */}
            {potentialValue && (
              <div className="text-sm">
                <span className="text-slate-500">חיסכון משוער: </span>
                <span className="font-medium text-indigo-600">
                  ₪{potentialValue.toLocaleString()}
                </span>
              </div>
            )}

            {/* Action button */}
            {actionUrl && (
              <a
                href={actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: '#2B4699' }}
              >
                למידע נוסף
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

