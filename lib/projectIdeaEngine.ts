import type {
  DerivedSkillIntelligence,
  CareerGapAnalysis,
  ProjectIdeasInput,
  CareerProjectIdea,
  RecommendationPriority,
} from '@/types/career';

/**
 * Project Idea Engine — Phase 8F-1
 *
 * Turns career gaps into practical project ideas via Gemini.
 * Every project idea must originate from an actual career gap.
 *
 * AI generates: title, description, problem framing, rationale, requirements.
 * AI must NOT: invent existing projects, claim existing evidence, modify scores.
 */

// ── Input Builder ────────────────────────────────────────────

/**
 * Build structured project idea input from existing intelligence data.
 * Only sends gap-relevant information — no private or unnecessary data.
 */
export function buildProjectIdeasInput(
  gapAnalysis: CareerGapAnalysis,
  skillIntelligence: DerivedSkillIntelligence[],
  existingProjectCount: number,
  existingProjectNames: string[],
): ProjectIdeasInput | null {
  if (!gapAnalysis.targetRole) return null;

  // Only generate project ideas if there are actual gaps
  if (gapAnalysis.gaps.length === 0) return null;

  return {
    targetRole: gapAnalysis.targetRole,
    careerGaps: gapAnalysis.gaps.map((g) => ({
      skill: g.skill,
      status: g.status,
      priority: g.priority,
      missingEvidence: g.missingEvidence,
    })),
    demonstratedSkills: gapAnalysis.demonstratedSkills,
    existingProjectCount,
    existingProjectNames: existingProjectNames.slice(0, 10),
  };
}

// ── Validation ───────────────────────────────────────────────

const VALID_PRIORITIES: RecommendationPriority[] = ['high', 'medium', 'low'];

/**
 * Validate a single project idea from Gemini.
 * Returns the validated idea or null if invalid.
 */
function validateProjectIdea(
  raw: Record<string, unknown>,
  index: number,
  knownGaps: Array<{ skill: string }>,
): CareerProjectIdea | null {
  const id = `proj-${Date.now()}-${index}`;

  const title = String(raw.title ?? '').trim();
  if (!title) return null;

  const shortDescription = String(raw.shortDescription ?? '').trim();
  if (!shortDescription) return null;

  const problem = String(raw.problem ?? '').trim();
  if (!problem) return null;

  const whyThisProject = String(raw.whyThisProject ?? '').trim();
  if (!whyThisProject) return null;

  const relatedGap = String(raw.relatedGap ?? '').trim();
  if (!relatedGap) return null;

  const priority = String(raw.priority ?? '').toLowerCase().trim();
  if (!VALID_PRIORITIES.includes(priority as RecommendationPriority)) return null;

  const skillsToDemonstrate = Array.isArray(raw.skillsToDemonstrate)
    ? raw.skillsToDemonstrate.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(String)
    : [];
  if (skillsToDemonstrate.length === 0) return null;

  const evidenceToCreate = Array.isArray(raw.evidenceToCreate)
    ? raw.evidenceToCreate.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(String)
    : [];
  if (evidenceToCreate.length === 0) return null;

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(String)
    : [];
  if (requirements.length === 0) return null;

  // Grounding: relatedGap must match an actual career gap
  const matchesKnownGap = knownGaps.some(
    (g) => g.skill.toLowerCase() === relatedGap.toLowerCase() ||
            relatedGap.toLowerCase().includes(g.skill.toLowerCase()) ||
            g.skill.toLowerCase().includes(relatedGap.toLowerCase()),
  );
  if (!matchesKnownGap) return null;

  return {
    id,
    title,
    shortDescription,
    problem,
    whyThisProject,
    relatedGap,
    priority: priority as RecommendationPriority,
    skillsToDemonstrate,
    evidenceToCreate,
    requirements,
  };
}

/**
 * Validate an array of project ideas from Gemini.
 * Filters out invalid entries, limits to 3, ensures grounding.
 */
export function validateProjectIdeas(
  raw: unknown,
  input: ProjectIdeasInput,
): CareerProjectIdea[] {
  if (!Array.isArray(raw)) return [];

  const results: CareerProjectIdea[] = [];

  for (let i = 0; i < raw.length && i < 3; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const validated = validateProjectIdea(item as Record<string, unknown>, i, input.careerGaps);
    if (validated) {
      results.push(validated);
    }
  }

  // Sort by priority: high first
  const prioOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  results.sort((a, b) => prioOrder[b.priority] - prioOrder[a.priority]);

  return results;
}

/**
 * Parse Gemini's raw text response into a structured array.
 * Handles markdown code fences and common JSON formatting issues.
 */
export function parseProjectIdeasResponse(text: string): unknown[] {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
