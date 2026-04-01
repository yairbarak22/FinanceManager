import type { ReactNode } from 'react';

import { basicsContent } from './basics';
import { courseContent } from './course';
import { actionContent } from './action';
import { faqContent } from './faq';

const allContent: Record<string, ReactNode> = {
  ...basicsContent,
  ...courseContent,
  ...actionContent,
  ...faqContent,
};

export function getInvestArticleContent(slug: string): ReactNode {
  return allContent[slug] || null;
}
