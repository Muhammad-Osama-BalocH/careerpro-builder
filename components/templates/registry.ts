import type { ComponentType } from 'react';
import type { Portfolio } from '@/types/portfolio';
import { PortfolioTemplate1 } from '@/components/PortfolioTemplate1';
import { PortfolioTemplate2 } from '@/components/PortfolioTemplate2';
import { PortfolioTemplate3 } from '@/components/PortfolioTemplate3';
import { DeveloperTemplate } from '@/components/DeveloperTemplate';
import { ModernAITemplate } from '@/components/ModernAITemplate';

export interface TemplateEntry {
  component: ComponentType<{ portfolio: Portfolio }>;
  label: string;
}

const templates: Record<string, TemplateEntry> = {
  minimal:       { component: PortfolioTemplate1, label: 'Minimal Professional' },
  template1:     { component: PortfolioTemplate1, label: 'Template 1' },
  creative:      { component: PortfolioTemplate2, label: 'Creative' },
  template2:     { component: PortfolioTemplate2, label: 'Template 2' },
  modern:        { component: PortfolioTemplate2, label: 'Modern' },
  professional:  { component: PortfolioTemplate3, label: 'Professional' },
  template3:     { component: PortfolioTemplate3, label: 'Template 3' },
  dark:          { component: PortfolioTemplate3, label: 'Dark' },
  developer:     { component: DeveloperTemplate, label: 'Developer' },
  'modern-ai':   { component: ModernAITemplate, label: 'Modern AI' },
};

/** Canonical keys used in builder/dashboard selectors. */
export const CANONICAL_TEMPLATES: { key: string; label: string }[] = [
  { key: 'minimal', label: 'Minimal Professional' },
  { key: 'creative', label: 'Creative' },
  { key: 'professional', label: 'Professional' },
  { key: 'dark', label: 'Dark' },
  { key: 'developer', label: 'Developer' },
  { key: 'modern-ai', label: 'Modern AI' },
];

export function resolveTemplate(key: string): TemplateEntry {
  return templates[key] ?? templates['minimal'];
}
