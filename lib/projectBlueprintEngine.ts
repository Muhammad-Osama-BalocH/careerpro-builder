import type {
  CareerProjectIdea,
  CareerProjectBlueprint,
  BlueprintInput,
  BlueprintFeatureGroup,
  BlueprintDatabaseEntity,
  BlueprintDatabaseRelation,
  BlueprintDatabaseSchema,
  BlueprintTechnologyGroup,
  CareerGapAnalysis,
} from '@/types/career';

/**
 * Project Blueprint Engine — Phase 8F-2
 *
 * Generates a technical blueprint for a selected project idea.
 * The blueprint must remain grounded in the actual career gap and project idea.
 *
 * AI generates: objective, requirements, features, architecture, database schema,
 *   development tasks, technologies, expected evidence.
 * AI must NOT: invent user achievements, claim existing evidence, modify scores,
 *   or generate a blueprint for a project unrelated to the selected idea.
 */

// ── Input Builder ────────────────────────────────────────────

/**
 * Build structured blueprint input from a selected project idea and career data.
 * Returns null if the project idea is invalid or data is insufficient.
 */
export function buildBlueprintInput(
  selectedIdea: CareerProjectIdea | null,
  gapAnalysis: CareerGapAnalysis,
): BlueprintInput | null {
  if (!selectedIdea) return null;
  if (!selectedIdea.title.trim()) return null;
  if (!gapAnalysis.targetRole) return null;

  return {
    projectTitle: selectedIdea.title,
    projectDescription: selectedIdea.shortDescription,
    relatedGap: selectedIdea.relatedGap,
    skillsToDemonstrate: selectedIdea.skillsToDemonstrate,
    projectRequirements: selectedIdea.requirements,
    targetRole: gapAnalysis.targetRole,
    demonstratedSkills: gapAnalysis.demonstratedSkills,
  };
}

// ── Validation helpers ───────────────────────────────────────

function validateStringField(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  return filtered.length > 0 ? filtered : null;
}

function validateFeatureGroups(value: unknown): BlueprintFeatureGroup[] | null {
  if (!Array.isArray(value)) return null;
  const groups: BlueprintFeatureGroup[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const category = validateStringField(raw.category);
    const items = validateStringArray(raw.items);
    if (!category || !items) continue;
    groups.push({ category, items });
  }
  return groups.length > 0 ? groups : null;
}

function validateDatabaseSchema(value: unknown): BlueprintDatabaseSchema | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const entities: BlueprintDatabaseEntity[] = [];
  if (Array.isArray(raw.entities)) {
    for (const ent of raw.entities) {
      if (!ent || typeof ent !== 'object') continue;
      const e = ent as Record<string, unknown>;
      const name = validateStringField(e.name);
      const fields = validateStringArray(e.fields);
      if (name && fields) entities.push({ name, fields });
    }
  }

  const relationships: BlueprintDatabaseRelation[] = [];
  if (Array.isArray(raw.relationships)) {
    for (const rel of raw.relationships) {
      if (!rel || typeof rel !== 'object') continue;
      const r = rel as Record<string, unknown>;
      const description = validateStringField(r.description);
      if (description) relationships.push({ description });
    }
  }

  if (entities.length === 0) return null;
  return { entities, relationships };
}

function validateTechnologyGroups(value: unknown): BlueprintTechnologyGroup[] | null {
  if (!Array.isArray(value)) return null;
  const groups: BlueprintTechnologyGroup[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const category = validateStringField(raw.category);
    const items = validateStringArray(raw.items);
    if (!category || !items) continue;
    groups.push({ category, items });
  }
  return groups.length > 0 ? groups : null;
}

// ── Blueprint Validation ─────────────────────────────────────

/**
 * Validate a raw Gemini blueprint object.
 * Returns the validated CareerProjectBlueprint or null if invalid.
 */
export function validateBlueprint(
  raw: unknown,
  input: BlueprintInput,
): CareerProjectBlueprint | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  const projectTitle = validateStringField(obj.projectTitle);
  if (!projectTitle) return null;

  const projectDescription = validateStringField(obj.projectDescription);
  if (!projectDescription) return null;

  const relatedGap = validateStringField(obj.relatedGap);
  if (!relatedGap) return null;

  const objective = validateStringField(obj.objective);
  if (!objective) return null;

  const requirements = validateStringArray(obj.requirements);
  if (!requirements) return null;

  const features = validateFeatureGroups(obj.features);
  if (!features) return null;

  const architecture = validateStringField(obj.architecture);
  if (!architecture) return null;

  const databaseSchema = validateDatabaseSchema(obj.databaseSchema);
  if (!databaseSchema) return null;

  const developmentTasks = validateStringArray(obj.developmentTasks);
  if (!developmentTasks) return null;

  const technologies = validateTechnologyGroups(obj.technologies);
  if (!technologies) return null;

  const expectedEvidence = validateStringArray(obj.expectedEvidence);
  if (!expectedEvidence) return null;

  // Grounding: blueprint must reference the same gap as the input
  const gapMatch = relatedGap.toLowerCase() === input.relatedGap.toLowerCase() ||
                   relatedGap.toLowerCase().includes(input.relatedGap.toLowerCase()) ||
                   input.relatedGap.toLowerCase().includes(relatedGap.toLowerCase());

  if (!gapMatch) return null;

  return {
    projectTitle,
    projectDescription,
    relatedGap,
    objective,
    requirements,
    features,
    architecture,
    databaseSchema,
    developmentTasks,
    technologies,
    expectedEvidence,
  };
}

// ── Response Parsing ─────────────────────────────────────────

/**
 * Parse Gemini's raw text response into a structured object.
 * Handles markdown code fences and JSON formatting.
 */
export function parseBlueprintResponse(text: string): unknown {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
