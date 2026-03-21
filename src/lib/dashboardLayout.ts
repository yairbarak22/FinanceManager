import {
  DEFAULT_DASHBOARD_CONFIG,
  type DashboardSectionConfig,
  type DashboardSectionId,
} from '@/types/dashboardConfig';

const ALL_SECTION_IDS = DEFAULT_DASHBOARD_CONFIG.map((c) => c.id);

/**
 * Merge a potentially stale/partial saved layout with the current defaults.
 * Ensures every known section exists exactly once and unknown IDs are dropped.
 */
export function mergeDashboardLayout(
  saved: unknown,
): DashboardSectionConfig[] {
  if (!Array.isArray(saved)) return [...DEFAULT_DASHBOARD_CONFIG];

  const seen = new Set<DashboardSectionId>();
  const merged: DashboardSectionConfig[] = [];

  for (const item of saved) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Record<string, unknown>).id !== 'string' ||
      typeof (item as Record<string, unknown>).isVisible !== 'boolean' ||
      typeof (item as Record<string, unknown>).order !== 'number'
    )
      continue;
    const id = (item as { id: string }).id as DashboardSectionId;
    if (!ALL_SECTION_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    merged.push({
      id,
      isVisible: (item as { isVisible: boolean }).isVisible,
      order: merged.length,
    });
  }

  for (const def of DEFAULT_DASHBOARD_CONFIG) {
    if (!seen.has(def.id)) {
      merged.push({ ...def, order: merged.length });
    }
  }

  return merged;
}

/**
 * Partition sections so visible ones always precede hidden ones,
 * preserving relative order within each group.
 */
export function sortVisibleFirst(
  sections: DashboardSectionConfig[],
): DashboardSectionConfig[] {
  const byOrder = [...sections].sort((a, b) => a.order - b.order);
  const visible = byOrder.filter((c) => c.isVisible);
  const hidden = byOrder.filter((c) => !c.isVisible);
  return [...visible, ...hidden].map((item, i) => ({ ...item, order: i }));
}
