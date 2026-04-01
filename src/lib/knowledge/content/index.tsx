import type { ReactNode } from 'react';

// Category content files
import { systemGuidesContent } from './system-guides';
import { financeBasicsContent } from './finance-basics';
import { investmentsContent } from './investments';
import { housingContent } from './housing';
import { pensionInsuranceContent } from './pension-insurance';
import { debtCreditContent } from './debt-credit';

// Invest content (merged into knowledge)
import { basicsContent } from '@/lib/invest/content/basics';
import { courseContent } from '@/lib/invest/content/course';
import { actionContent } from '@/lib/invest/content/action';
import { faqContent } from '@/lib/invest/content/faq';

const allContent: Record<string, ReactNode> = {
  ...systemGuidesContent,
  ...financeBasicsContent,
  ...investmentsContent,
  ...housingContent,
  ...pensionInsuranceContent,
  ...debtCreditContent,
  // Invest content
  ...basicsContent,
  ...courseContent,
  ...actionContent,
  ...faqContent,
};

export function getArticleContent(slug: string): ReactNode {
  return allContent[slug] || null;
}
