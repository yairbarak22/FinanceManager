import type { ReactNode } from 'react';
import type { DashboardSectionId } from '@/types/dashboardConfig';
import FinancialStatusSection from './FinancialStatusSection';
import CashFlowSection from './CashFlowSection';
import ActivitySection from './ActivitySection';
import PortfolioSection from './PortfolioSection';
import TrendsSection from './TrendsSection';
import InvestmentPortfolioSection from './InvestmentPortfolioSection';
import GoalsSection from './GoalsSection';
import BudgetsSection from './BudgetsSection';
import type { FinancialStatusSectionProps } from './FinancialStatusSection';
import type { CashFlowSectionProps } from './CashFlowSection';
import type { ActivitySectionProps } from './ActivitySection';
import type { PortfolioSectionProps } from './PortfolioSection';
import type { TrendsSectionProps } from './TrendsSection';
import type { InvestmentPortfolioSectionProps } from './InvestmentPortfolioSection';
import type { GoalsSectionProps } from './GoalsSection';
import type { BudgetsSectionProps } from './BudgetsSection';

export const SECTION_COMPONENTS = {
  financial_status: FinancialStatusSection,
  cash_flow: CashFlowSection,
  activity: ActivitySection,
  portfolio: PortfolioSection,
  trends: TrendsSection,
  investment_portfolio: InvestmentPortfolioSection,
  goals: GoalsSection,
  budgets: BudgetsSection,
} as const satisfies Record<DashboardSectionId, React.ComponentType<never>>;

export interface DashboardSectionPropsBundles {
  financial_status: FinancialStatusSectionProps;
  cash_flow: CashFlowSectionProps;
  activity: ActivitySectionProps;
  portfolio: PortfolioSectionProps;
  trends: TrendsSectionProps;
  investment_portfolio: InvestmentPortfolioSectionProps;
  goals: GoalsSectionProps;
  budgets: BudgetsSectionProps;
}

export function renderDashboardSection(
  id: DashboardSectionId,
  bundles: DashboardSectionPropsBundles,
): ReactNode {
  switch (id) {
    case 'financial_status':
      return <FinancialStatusSection {...bundles.financial_status} />;
    case 'cash_flow':
      return <CashFlowSection {...bundles.cash_flow} />;
    case 'activity':
      return <ActivitySection {...bundles.activity} />;
    case 'portfolio':
      return <PortfolioSection {...bundles.portfolio} />;
    case 'trends':
      return <TrendsSection {...bundles.trends} />;
    case 'investment_portfolio':
      return <InvestmentPortfolioSection {...bundles.investment_portfolio} />;
    case 'goals':
      return <GoalsSection {...bundles.goals} />;
    case 'budgets':
      return <BudgetsSection {...bundles.budgets} />;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
