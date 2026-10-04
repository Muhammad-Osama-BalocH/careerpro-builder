'use client';

import { resolveTemplate } from '@/components/templates/registry';
import type { Portfolio } from '@/types/portfolio';

export function Preview({ portfolio }: { portfolio: Portfolio }) {
  const templateKey = portfolio.template || 'minimal';
  const entry = resolveTemplate(templateKey);
  const Template = entry.component;

  return <Template portfolio={portfolio} />;
}
