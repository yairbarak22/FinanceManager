'use client';

import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardSectionConfig } from '@/types/dashboardConfig';
import {
  SECTION_TITLES,
  SECTION_DESCRIPTIONS,
  SECTION_WHAT_INCLUDES,
} from '@/types/dashboardConfig';
import SectionWireframe from './SectionWireframe';

interface SectionThumbnailProps {
  config: DashboardSectionConfig;
  onToggle: (id: string) => void;
}

export default function SectionThumbnail({ config, onToggle }: SectionThumbnailProps) {
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

  const bullets = SECTION_WHAT_INCLUDES[config.id];

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      className={`rounded-2xl border bg-white transition-shadow ${
        isDragging
          ? 'z-10 shadow-xl border-[#0DBACC]/40 scale-[1.01]'
          : 'border-[#EDEDF0] shadow-sm hover:shadow-md'
      }`}
    >
      {/* Top bar: title + toggle */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="cursor-grab touch-none text-[#C5C5D0] hover:text-[#7E7F90] active:cursor-grabbing p-1 -m-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#303150' }}>
            {SECTION_TITLES[config.id]}
          </h3>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={config.isVisible}
          aria-label={`${config.isVisible ? 'הסתר' : 'הצג'} ${SECTION_TITLES[config.id]}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(config.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
            config.isVisible ? 'bg-[#0DBACC]' : 'bg-[#E8E8ED]'
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

      {/* Body: info panel (right in RTL) + skeleton preview (left in RTL) */}
      <div
        className={`flex flex-col sm:flex-row gap-5 px-5 pb-6 pt-3 cursor-grab active:cursor-grabbing touch-none ${
          config.isVisible ? 'opacity-100' : 'opacity-40'
        } transition-opacity`}
        {...attributes}
        {...listeners}
      >
        {/* Info panel — first child = right side in RTL */}
        <div className="sm:w-52 shrink-0 flex flex-col gap-2 justify-center">
          <p className="text-xs leading-relaxed" style={{ color: '#7E7F90' }}>
            {SECTION_DESCRIPTIONS[config.id]}
          </p>
          <p className="text-[11px] font-semibold mt-1" style={{ color: '#A0A0B0' }}>
            מה מוצג כאן?
          </p>
          <ul className="flex flex-col gap-1.5">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="text-[11px] leading-relaxed flex items-start gap-1.5"
                style={{ color: '#7E7F90' }}
              >
                <span className="mt-1 size-1 rounded-full bg-[#C5C5D0] shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Skeleton preview — second child = left side in RTL */}
        <div className="flex-1 min-w-0 rounded-xl bg-[#FAFAFB] border border-[#F0F0F4] p-5 min-h-[140px] flex items-center">
          <div className="w-full">
            <SectionWireframe id={config.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
