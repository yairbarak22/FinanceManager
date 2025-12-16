import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface MonthYear {
  month: number; // 1-12
  year: number;
}

export type Owner = "me" | "partner" | "joint" | "kids";

// Helper to get current month
function getCurrentMonth(): MonthYear {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // getMonth() returns 0-11
    year: now.getFullYear(),
  };
}

// Helper to get date range from MonthYear
export function getMonthDateRange(monthYear: MonthYear): { start: Date; end: Date } {
  const start = new Date(monthYear.year, monthYear.month - 1, 1);
  const end = new Date(monthYear.year, monthYear.month, 0); // Last day of month
  return { start, end };
}

// Helper to get previous month
export function getPreviousMonth(monthYear: MonthYear): MonthYear {
  if (monthYear.month === 1) {
    return { month: 12, year: monthYear.year - 1 };
  }
  return { month: monthYear.month - 1, year: monthYear.year };
}

// Helper to format MonthYear to string (e.g., "2024-12")
export function formatMonthYear(monthYear: MonthYear): string {
  return `${monthYear.year}-${String(monthYear.month).padStart(2, "0")}`;
}

// Helper to parse MonthYear from string
export function parseMonthYear(str: string): MonthYear {
  const [year, month] = str.split("-").map(Number);
  return { month, year };
}

// Store interface
interface AppState {
  // Global Month Filter
  selectedMonth: MonthYear;
  setSelectedMonth: (month: MonthYear) => void;

  // Ownership Filter
  ownerFilter: Owner | "all";
  setOwnerFilter: (owner: Owner | "all") => void;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Default to current month
      selectedMonth: getCurrentMonth(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),

      // Default to show all owners
      ownerFilter: "all",
      setOwnerFilter: (owner) => set({ ownerFilter: owner }),

      // Sidebar state
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "family-office-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        ownerFilter: state.ownerFilter,
      }),
    }
  )
);

