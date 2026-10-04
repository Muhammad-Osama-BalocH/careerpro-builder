import type {
  DerivedSkillIntelligence,
  CareerGapAnalysis,
  StructuredRecommendationsInput,
  StructuredCareerRecommendation,
  RecommendationPriority,
  RecommendationType,
} from '@/types/career';

/**
 * Career Recommendation Engine — Phase 8E
 *
 * Builds structured input from 8B/8C/8D intelligence data,
 * validates Gemini output, and ensures AI recommendations
 * are grounded in actual user data.
 *
 * AI is responsible for: title, explanation, suggested action, project direction.
 * AI must NOT: invent skills, projects, experience, certificates, or evidence.
 */

// ── Input Builder ────────────────────────────────────────────

/**
 * Build structured recommendation input from existing intelligence data.
 * Only sends what Gemini needs — no private information, no raw portfolio content.
 */
export function buildRecommendationInput(
  skillIntelligence: DerivedSkillIntelligence[],
  gapAnalysis: CareerGapAnalysis,
  projectCount: number,
  experienceCount: number,
): StructuredRecommendationsInput | null {
  if (!gapAnalysis.targetRole) return null;

  if (gapAnalysis.gaps.length === 0 && skillIntelligence.length === 0) return null;

  return {
    targetRole: gapAnalysis.targetRole,
    demonstratedSkills: gapAnalysis.demonstratedSkills,
    skillsWithStrength: skillIntelligence
      .filter((si) => si.evidenceCount > 0)
      .map((si) => ({
        skill: si.name,
        strength: si.strengthLevel,
        confidence: si.confidence,
      }))
      .slice(0, 20), // limit to avoid overly large prompts
    careerGaps: gapAnalysis.gaps.map((g) => ({
      skill: g.skill,
      status: g.status,
      priority: g.priority,
      missingEvidence: g.missingEvidence,
    })),
    projectCount,
    experienceCount,
  };
}

// ── Response Validation ──────────────────────────────────────

const VALID_TYPES: RecommendationType[] = ['build_project', 'strengthen_skill', 'create_evidence', 'improve_project', 'learning_task'];
const VALID_PRIORITIES: RecommendationPriority[] = ['high', 'medium', 'low'];

/**
 * Validate a single structured recommendation from Gemini.
 * Returns the validated recommendation or null if invalid.
 */
function validateRecommendation(
  raw: Record<string, unknown>,
  index: number,
): StructuredCareerRecommendation | null {
  const id = `rec-${Date.now()}-${index}`;

  const type = String(raw.type ?? '');
  if (!VALID_TYPES.includes(type as RecommendationType)) return null;

  const priority = String(raw.priority ?? '');
  if (!VALID_PRIORITIES.includes(priority as RecommendationPriority)) return null;

  const title = String(raw.title ?? '').trim();
  if (!title) return null;

  const description = String(raw.description ?? '').trim();
  if (!description) return null;

  const reason = String(raw.reason ?? '').trim();
  if (!reason) return null;

  const recommendedAction = String(raw.recommendedAction ?? '').trim();
  if (!recommendedAction) return null;

  const relatedSkill = String(raw.relatedSkill ?? '').trim();
  const relatedGap = String(raw.relatedGap ?? '').trim();
  const expectedOutcome = String(raw.expectedOutcome ?? '').trim();
  const skillsToDevelop = Array.isArray(raw.skillsToDevelop)
    ? raw.skillsToDevelop.filter((s): s is string => typeof s === 'string').map(String)
    : [];
  const evidenceToCreate = Array.isArray(raw.evidenceToCreate)
    ? raw.evidenceToCreate.filter((s): s is string => typeof s === 'string').map(String)
    : [];

  return {
    id,
    type: type as RecommendationType,
    title,
    description,
    relatedSkill,
    relatedGap,
    reason,
    priority: priority as RecommendationPriority,
    recommendedAction,
    expectedOutcome,
    skillsToDevelop,
    evidenceToCreate,
  };
}

/**
 * Validate an array of structured recommendations from Gemini.
 * Filters out invalid entries, limits count, and ensures grounding.
 */
export function validateRecommendations(
  raw: unknown,
  input: StructuredRecommendationsInput,
): StructuredCareerRecommendation[] {
  if (!Array.isArray(raw)) return [];

  const results: StructuredCareerRecommendation[] = [];

  for (let i = 0; i < raw.length && i < 5; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const validated = validateRecommendation(item as Record<string, unknown>, i);
    if (validated) {
      // Grounding check: at least one field must reference a known gap
      const referencesGap = input.careerGaps.some(
        (g) =>
          validated.relatedGap.toLowerCase().includes(g.skill.toLowerCase()) ||
          validated.relatedSkill.toLowerCase().includes(g.skill.toLowerCase()) ||
          validated.reason.toLowerCase().includes(g.skill.toLowerCase()) ||
          validated.description.toLowerCase().includes(g.skill.toLowerCase()),
      );
      if (referencesGap) {
        results.push(validated);
      }
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
export function parseGeminiResponse(text: string): unknown[] {
  let cleaned = text.trim();

  // Remove markdown code fences
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
