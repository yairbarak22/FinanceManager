'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X, GripVertical, LayoutDashboard } from 'lucide-react';
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SECTION_TITLES,
  type DashboardSectionConfig,
} from '@/types/dashboardConfig';

interface EditLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: DashboardSectionConfig[];
  onSave: (newConfig: DashboardSectionConfig[]) => void;
}

function normalizeOrders(config: DashboardSectionConfig[]): DashboardSectionConfig[] {
  return config.map((item, index) => ({ ...item, order: index }));
}

function SortableRow({
  config,
  onToggle,
}: {
  config: DashboardSectionConfig;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow ${
        isDragging
          ? 'z-10 border-indigo-300 bg-indigo-50/60 shadow-lg'
          : 'border-slate-200 bg-white'
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
        aria-label="גרור לשינוי סדר"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="flex-1 text-sm font-medium text-[#303150]">
        {SECTION_TITLES[config.id]}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={config.isVisible}
        aria-label={`${config.isVisible ? 'הסתר' : 'הצג'} ${SECTION_TITLES[config.id]}`}
        onClick={() => onToggle(config.id)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
          config.isVisible ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
            config.isVisible ? '-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function EditLayoutModalContent({
  initialConfig,
  onClose,
  onSave,
}: Omit<EditLayoutModalProps, 'isOpen'>) {
  const [localConfig, setLocalConfig] = useState<DashboardSectionConfig[]>(
    () => normalizeOrders([...initialConfig].sort((a, b) => a.order - b.order)),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalConfig((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      return normalizeOrders(arrayMove(prev, oldIndex, newIndex));
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    setLocalConfig((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c)),
    );
  }, []);

  const handleSave = useCallback(() => {
    onSave(normalizeOrders(localConfig));
    onClose();
  }, [localConfig, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  const sortableIds = localConfig.map((c) => c.id);

  return (
    <div
      className="modal-overlay"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9999 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-layout-title"
        className="modal-content max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 id="edit-layout-title" className="text-lg font-semibold text-[#303150]">
              עריכת דשבורד
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="סגור">
            <X className="w-5 h-5 text-[#7E7F90]" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="text-sm text-[#7E7F90] mb-4">
            גרור כדי לשנות סדר, והפעל/כבה כדי להציג או להסתיר סקשנים.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {localConfig.map((cfg) => (
                  <SortableRow key={cfg.id} config={cfg} onToggle={handleToggle} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
          <button type="button" onClick={handleSave} className="btn-primary flex-1">
            שמירה
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditLayoutModal({
  isOpen,
  onClose,
  initialConfig,
  onSave,
}: EditLayoutModalProps) {
  const subscribe = useCallback(() => () => {}, []);
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <EditLayoutModalContent
      initialConfig={initialConfig}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body,
  );
}
