import type {
  AdminTaskStatus as PrismaAdminTaskStatus,
  AdminTaskPriority as PrismaAdminTaskPriority,
  AdminTaskGroup as PrismaAdminTaskGroup,
  AdminTask as PrismaAdminTask,
} from '@prisma/client';

// Re-export Prisma enums as values for runtime use
export const AdminTaskStatus = {
  WORKING_ON_IT: 'WORKING_ON_IT',
  DONE: 'DONE',
  STUCK: 'STUCK',
  NOT_STARTED: 'NOT_STARTED',
} as const;

export const AdminTaskPriority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

// Pipeline sort: NOT_STARTED → WORKING_ON_IT → STUCK → DONE
export const STATUS_SORT_ORDER: Record<PrismaAdminTaskStatus, number> = {
  NOT_STARTED: 0,
  WORKING_ON_IT: 1,
  STUCK: 2,
  DONE: 3,
};

// Types derived from Prisma
export type AdminTaskStatus = PrismaAdminTaskStatus;
export type AdminTaskPriority = PrismaAdminTaskPriority;
export type AdminTaskGroup = PrismaAdminTaskGroup;
export type AdminTask = PrismaAdminTask;

export type AdminTaskWithChildren = AdminTask & {
  children: AdminTask[];
};

export type AdminTaskGroupWithTasks = AdminTaskGroup & {
  tasks: AdminTaskWithChildren[];
};

export type RoadmapData = {
  groups: AdminTaskGroupWithTasks[];
};

// Monday.com-style color mappings
export const STATUS_COLORS: Record<AdminTaskStatus, string> = {
  WORKING_ON_IT: '#FF9800',
  DONE: '#00C875',
  STUCK: '#E2445C',
  NOT_STARTED: '#C4C4C4',
};

export const STATUS_LABELS: Record<AdminTaskStatus, string> = {
  WORKING_ON_IT: 'עובד על זה',
  DONE: 'הושלם',
  STUCK: 'תקוע',
  NOT_STARTED: 'לא התחיל',
};

export const PRIORITY_COLORS: Record<AdminTaskPriority, string> = {
  HIGH: '#8B5CF6',
  MEDIUM: '#A855F7',
  LOW: '#60A5FA',
};

export const PRIORITY_LABELS: Record<AdminTaskPriority, string> = {
  HIGH: 'גבוהה',
  MEDIUM: 'בינונית',
  LOW: 'נמוכה',
};
