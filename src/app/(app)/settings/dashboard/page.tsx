'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import SectionThumbnail from '@/components/dashboard/settings/SectionThumbnail';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import { apiFetch } from '@/lib/utils';
import { dashboardKeys } from '@/hooks/useDashboardData';
import { mergeDashboardLayout, sortVisibleFirst } from '@/lib/dashboardLayout';
import { DEFAULT_DASHBOARD_CONFIG, type DashboardSectionConfig } from '@/types/dashboardConfig';

function normalizeOrders(config: DashboardSectionConfig[]): DashboardSectionConfig[] {
  return config.map((item, index) => ({ ...item, order: index }));
}

const MIN_SPINNER_MS = 220;

export default function DashboardSettingsPage() {
  const queryClient = useQueryClient();
  const { toasts, removeToast, success, error: showError } = useToast();

  const { data: serverLayout, isLoading: isLayoutLoading } = useQuery({
    queryKey: dashboardKeys.dashboardLayout,
    queryFn: async () => {
      const res = await apiFetch('/api/user/dashboard-layout');
      if (!res.ok) throw new Error('Failed to fetch layout');
      const json = await res.json();
      return mergeDashboardLayout(json.layout);
    },
    staleTime: 60_000,
  });

  const [localConfig, setLocalConfig] = useState<DashboardSectionConfig[] | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const config = useMemo(() => {
    if (localConfig) return sortVisibleFirst(localConfig);
    if (serverLayout) return sortVisibleFirst([...serverLayout].sort((a, b) => a.order - b.order));
    return null;
  }, [localConfig, serverLayout]);

  const saveMutation = useMutation({
    mutationFn: async (layout: DashboardSectionConfig[]) => {
      const res = await apiFetch('/api/user/dashboard-layout', {
        method: 'PATCH',
        body: JSON.stringify(layout),
      });
      if (!res.ok) throw new Error('Failed to save layout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.dashboardLayout });
      success('פריסת הדשבורד נשמרה בהצלחה');
    },
    onError: () => {
      showError('שגיאה בשמירת הפריסה');
    },
  });

  const isBusy = saveMutation.isPending || isResetting;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalConfig((prev) => {
      const source = prev ?? config ?? [];
      const oldIndex = source.findIndex((c) => c.id === active.id);
      const newIndex = source.findIndex((c) => c.id === over.id);
      return normalizeOrders(arrayMove(source, oldIndex, newIndex));
    });
  }, [config]);

  const handleToggle = useCallback((id: string) => {
    setLocalConfig((prev) => {
      const source = prev ?? config ?? [];
      return source.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c));
    });
  }, [config]);

  const handleSave = useCallback(() => {
    if (!config) return;
    saveMutation.mutate(sortVisibleFirst(config));
    setLocalConfig(null);
  }, [config, saveMutation]);

  const handleResetToDefault = useCallback(() => {
    clearTimeout(resetTimerRef.current);
    setIsResetting(true);
    setLocalConfig(normalizeOrders(DEFAULT_DASHBOARD_CONFIG.map((c) => ({ ...c }))));
    resetTimerRef.current = setTimeout(() => setIsResetting(false), MIN_SPINNER_MS);
  }, []);

  const isDirty = localConfig !== null;

  return (
      <div className="max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            התאמת הדשבורד האישי שלך
          </h1>
          <p
            className="text-sm mt-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            בחר אילו נתונים יוצגו וסדר אותם בגרירה בדיוק איך שנוח לך
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-6" aria-busy={isBusy || undefined}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isBusy}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
              isDirty && !isBusy
                ? 'bg-[#0DBACC] hover:bg-[#0DBACC]/90 shadow-md'
                : 'bg-[#E8E8ED] cursor-not-allowed'
            }`}
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            שמירת שינויים
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isBusy}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
              isBusy
                ? 'border-[#E8E8ED] text-[#BDBDCB] cursor-not-allowed'
                : 'border-[#E8E8ED] text-[#7E7F90] hover:border-[#BDBDCB] hover:text-[#303150]'
            }`}
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            חזרה לברירת מחדל
          </button>
        </div>

        {/* Sortable list */}
        {isLayoutLoading || !config ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={config.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {config.map((cfg) => (
                  <SectionThumbnail
                    key={cfg.id}
                    config={cfg}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
  );
}
