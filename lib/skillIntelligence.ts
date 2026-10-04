import type { Portfolio } from '@/types/portfolio';
import type {
  CareerEvidence,
  DerivedSkillIntelligence,
  EvidenceSourceType,
  SkillCategory,
  SkillStrengthLevel,
} from '@/types/career';

// ── Technology Relationships ──────────────────────────────────
// Deterministic, well-known mappings only.
// A technology in a project's techStack implies these broader skills.
// All keys are lowercase for case-insensitive matching.

const TECH_RELATIONSHIPS: Record<string, string[]> = {
  react: ['javascript', 'frontend development'],
  'react.js': ['javascript', 'frontend development'],
  angular: ['javascript', 'typescript', 'frontend development'],
  vue: ['javascript', 'frontend development'],
  'vue.js': ['javascript', 'frontend development'],
  'next.js': ['javascript', 'frontend development', 'react'],
  nextjs: ['javascript', 'frontend development', 'react'],
  nuxt: ['javascript', 'frontend development', 'vue'],
  svelte: ['javascript', 'frontend development'],
  'node.js': ['javascript', 'backend development'],
  nodejs: ['javascript', 'backend development'],
  express: ['javascript', 'backend development'],
  'express.js': ['javascript', 'backend development'],
  nestjs: ['javascript', 'typescript', 'backend development'],
  typescript: ['javascript'],
  django: ['python', 'backend development'],
  flask: ['python', 'backend development', 'api development'],
  fastapi: ['python', 'backend development', 'api development'],
  spring: ['java', 'backend development'],
  'spring boot': ['java', 'backend development'],
  rails: ['ruby', 'backend development'],
  'ruby on rails': ['ruby', 'backend development'],
  tensorflow: ['python', 'machine learning'],
  pytorch: ['python', 'machine learning'],
  pandas: ['python', 'data analysis'],
  numpy: ['python', 'data analysis'],
  docker: ['devops'],
  kubernetes: ['devops'],
  terraform: ['devops', 'cloud computing'],
  aws: ['cloud computing'],
  azure: ['cloud computing'],
  gcp: ['cloud computing'],
  firebase: ['cloud computing'],
  mongodb: ['database'],
  postgresql: ['database'],
  mysql: ['database'],
  redis: ['database'],
  sqlite: ['database'],
  graphql: ['api development'],
  'tailwind css': ['css', 'frontend development'],
  tailwind: ['css', 'frontend development'],
  sass: ['css', 'frontend development'],
  scss: ['css', 'frontend development'],
  bootstrap: ['css', 'frontend development'],
  figma: ['ui/ux design'],
  git: ['version control'],
  github: ['version control', 'git'],
  keras: ['python', 'machine learning'],
  scikit: ['python', 'machine learning'],
  'scikit-learn': ['python', 'machine learning'],
  jupyter: ['python', 'data analysis'],
  opencv: ['python', 'machine learning'],
  huggingface: ['python', 'machine learning'],
  langchain: ['python', 'machine learning'],
};

// ── Skill Category Inference ──────────────────────────────────

const PROGRAMMING_LANGUAGES = new Set([
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'go',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'r', 'scala',
  'haskell', 'elixir', 'perl', 'lua', 'matlab', 'shell', 'bash',
]);

const SOFT_SKILL_PATTERNS = [
  'leadership', 'communication', 'teamwork', 'collaboration', 'management',
  'problem solving', 'critical thinking', 'creativity', 'adaptability',
  'time management', 'organization', 'mentoring', 'presentation', 'negotiation',
];

const DOMAIN_PATTERNS = [
  'frontend development', 'backend development', 'full stack', 'machine learning',
  'data analysis', 'data science', 'devops', 'cloud computing', 'cybersecurity',
  'mobile development', 'ui/ux design', 'api development', 'version control',
  'database', 'project management', 'agile', 'blockchain', 'game development',
];

// ── Main Function ────────────────────────────────────────────

/**
 * Derives skill intelligence from portfolio data and career evidence.
 * Pure deterministic calculation — no AI, no randomness.
 *
 * Every skill returned traces to actual user data:
 * - Explicitly listed portfolio skills
 * - Technologies from project tech stacks
 * - Skills inferred via deterministic tech relationships
 */
export function deriveSkillIntelligence(
  portfolio: Portfolio,
  evidence: CareerEvidence[],
): DerivedSkillIntelligence[] {
  const evidenceBySkill = groupEvidenceBySkill(evidence);
  const explicitlyListed = new Set(portfolio.skills.map((s) => s.toLowerCase()));

  // Collect all skill names: listed + from tech stacks + inferred
  const skillNames = new Set<string>();
  for (const s of portfolio.skills) skillNames.add(s.toLowerCase());
  for (const p of portfolio.projects) {
    for (const tech of p.techStack) {
      skillNames.add(tech.toLowerCase());
      const related = TECH_RELATIONSHIPS[tech.toLowerCase()];
      if (related) {
        for (const r of related) skillNames.add(r.toLowerCase());
      }
    }
  }

  const results: DerivedSkillIntelligence[] = [];

  for (const skillLower of skillNames) {
    const items = evidenceBySkill.get(skillLower) ?? [];
    const deduped = deduplicateEvidence(items);
    const sourceTypes = [...new Set(deduped.map((e) => e.sourceType))].sort() as EvidenceSourceType[];

    const confidence = calculateConfidence(deduped, sourceTypes);
    const strengthLevel = mapStrengthLevel(confidence);
    const category = inferCategory(skillLower, sourceTypes, deduped);

    results.push({
      name: preserveOriginalCase(skillLower, portfolio.skills, portfolio.projects),
      category,
      strengthLevel,
      confidence,
      evidenceCount: deduped.length,
      evidenceIds: deduped.map((e) => e.id),
      sourceTypes,
      explicitlyListed: explicitlyListed.has(skillLower),
    });
  }

  // Sort: explicitly listed first, then by confidence descending
  return results.sort((a, b) => {
    if (a.explicitlyListed !== b.explicitlyListed) return a.explicitlyListed ? -1 : 1;
    return b.confidence - a.confidence;
  });
}

// ── Evidence Aggregation ─────────────────────────────────────

function groupEvidenceBySkill(evidence: CareerEvidence[]): Map<string, CareerEvidence[]> {
  const map = new Map<string, CareerEvidence[]>();
  for (const e of evidence) {
    const key = e.skill.toLowerCase();
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return map;
}

/**
 * Deduplicate evidence by (sourceType, sourceId) pair.
 * Prevents the same source from inflating the score.
 * Keeps the strongest evidence when duplicates exist.
 */
function deduplicateEvidence(items: CareerEvidence[]): CareerEvidence[] {
  const best = new Map<string, CareerEvidence>();
  const strengthOrder: Record<CareerEvidence['evidenceStrength'], number> = { strong: 3, moderate: 2, weak: 1 };

  for (const e of items) {
    const key = `${e.sourceType}-${e.sourceId}`;
    const existing = best.get(key);
    if (!existing || strengthOrder[e.evidenceStrength] > strengthOrder[existing.evidenceStrength]) {
      best.set(key, e);
    }
  }

  return [...best.values()];
}

// ── Scoring Model ────────────────────────────────────────────
//
// Confidence = volume_score + diversity_score + quality_score
//
// Volume (0–40 pts): rewards number of unique evidence demonstrations
//   1 item = 8, 2 = 16, 3 = 24, 4 = 32, 5+ = 40
//
// Diversity (0–25 pts): rewards evidence from multiple source types
//   1 type = 0, 2 = 10, 3 = 18, 4 = 25
//
// Quality (0–35 pts): rewards strength of underlying evidence
//   weighted_sum = Σ (strong=3, moderate=2, weak=1)
//   max_possible = evidenceCount × 3
//   quality_score = round((weighted_sum / max_possible) × 35)

function calculateConfidence(items: CareerEvidence[], sourceTypes: EvidenceSourceType[]): number {
  if (items.length === 0) return 0;

  // Volume
  const volumeScore = Math.min(40, items.length * 8);

  // Diversity
  const typeCount = sourceTypes.length;
  let diversityScore: number;
  if (typeCount <= 1) diversityScore = 0;
  else if (typeCount === 2) diversityScore = 10;
  else if (typeCount === 3) diversityScore = 18;
  else diversityScore = 25;

  // Quality
  const strengthWeights: Record<CareerEvidence['evidenceStrength'], number> = { strong: 3, moderate: 2, weak: 1 };
  const weightedSum = items.reduce((sum, e) => sum + strengthWeights[e.evidenceStrength], 0);
  const maxPossible = items.length * 3;
  const qualityScore = Math.round((weightedSum / maxPossible) * 35);

  return Math.min(100, volumeScore + diversityScore + qualityScore);
}

function mapStrengthLevel(confidence: number): SkillStrengthLevel {
  if (confidence >= 76) return 'advanced';
  if (confidence >= 51) return 'strong';
  if (confidence >= 26) return 'developing';
  return 'emerging';
}

// ── Category Inference ───────────────────────────────────────

function inferCategory(
  skillLower: string,
  sourceTypes: EvidenceSourceType[],
  items: CareerEvidence[],
): SkillCategory {
  // Known programming language
  if (PROGRAMMING_LANGUAGES.has(skillLower)) return 'technical';

  // Known soft skill
  if (SOFT_SKILL_PATTERNS.some((p) => skillLower.includes(p))) return 'soft';

  // Known domain
  if (DOMAIN_PATTERNS.some((p) => skillLower === p)) return 'domain';

  // Frameworks/tools from tech stack
  if (sourceTypes.includes('project') && items.some((e) => e.sourceType === 'project')) return 'tool';

  // Experience-derived skills tend to be domain or soft
  if (sourceTypes.length === 1 && sourceTypes[0] === 'experience') return 'domain';

  return 'other';
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Use the original casing from the portfolio for display,
 * falling back to title case for inferred skills.
 */
function preserveOriginalCase(
  skillLower: string,
  listedSkills: string[],
  projects: Portfolio['projects'],
): string {
  // Check listed skills first
  for (const s of listedSkills) {
    if (s.toLowerCase() === skillLower) return s;
  }
  // Check project tech stacks
  for (const p of projects) {
    for (const tech of p.techStack) {
      if (tech.toLowerCase() === skillLower) return tech;
    }
  }
  // Fallback: title case
  return skillLower.replace(/\b\w/g, (c) => c.toUpperCase());
}
