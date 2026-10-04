import type {
  CareerProjectBlueprint,
  CareerDevelopmentRoadmap,
  CareerProjectDocumentationPack,
  DocsInput,
} from '@/types/career';

/**
 * Documentation Pack Engine — Phase 8F-3B
 *
 * Generates a professional GitHub & Documentation pack for a selected project.
 * Grounded in the project blueprint and roadmap — no invented features or evidence.
 *
 * AI generates: repository structure, README, docs, setup, testing, deployment, portfolio description.
 * AI must NOT: invent user achievements, claim existing evidence, add features not in the blueprint.
 */

// ── Input Builder ────────────────────────────────────────────

/**
 * Build structured documentation pack input from blueprint and roadmap.
 * Returns null if data is insufficient.
 */
export function buildDocsInput(
  blueprint: CareerProjectBlueprint | null,
  roadmap: CareerDevelopmentRoadmap | null,
  skillsToDemonstrate: string[],
): DocsInput | null {
  if (!blueprint) return null;
  if (!blueprint.projectTitle.trim()) return null;
  if (!blueprint.relatedGap.trim()) return null;

  return {
    projectTitle: blueprint.projectTitle,
    relatedGap: blueprint.relatedGap,
    objective: blueprint.objective,
    requirements: blueprint.requirements,
    features: blueprint.features,
    architecture: blueprint.architecture,
    databaseSchema: blueprint.databaseSchema,
    technologies: blueprint.technologies,
    expectedEvidence: blueprint.expectedEvidence,
    skillsToDemonstrate,
    phaseCount: roadmap?.phases.length ?? 0,
    totalTasks: roadmap?.totalTasks ?? 0,
  };
}

// ── Validation helpers ───────────────────────────────────────

function validateString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  return filtered.length > 0 ? filtered : null;
}

function containsFakeAchievement(text: string): boolean {
  const lower = text.toLowerCase();
  const fakePatterns = [
    'you already have',
    'you have proven',
    'you have demonstrated',
    'you have shown',
    'your experience in',
    'your expertise in',
    'years of experience',
    'you are proficient',
    'you are an expert',
    'you have successfully built',
  ];
  return fakePatterns.some((p) => lower.includes(p));
}

function containsFakeEvidence(text: string): boolean {
  const lower = text.toLowerCase();
  const fakePatterns = [
    'existing evidence shows',
    'you already demonstrated',
    'your existing evidence',
    'current evidence proves',
  ];
  return fakePatterns.some((p) => lower.includes(p));
}

// ── Pack Validation ──────────────────────────────────────────

/**
 * Validate a raw Gemini documentation pack object.
 * Returns the validated CareerProjectDocumentationPack or null if invalid.
 */
export function validateDocsPack(
  raw: unknown,
  input: DocsInput,
): CareerProjectDocumentationPack | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  const projectTitle = validateString(obj.projectTitle);
  if (!projectTitle) return null;

  const repositoryName = validateString(obj.repositoryName);
  if (!repositoryName) return null;

  const repositoryDescription = validateString(obj.repositoryDescription);
  if (!repositoryDescription) return null;

  const folderStructure = validateString(obj.folderStructure);
  if (!folderStructure) return null;

  const readme = validateString(obj.readme);
  if (!readme) return null;

  const documentation = validateStringArray(obj.documentation);
  if (!documentation) return null;

  const setupInstructions = validateString(obj.setupInstructions);
  if (!setupInstructions) return null;

  const testingDocumentation = validateString(obj.testingDocumentation);
  if (!testingDocumentation) return null;

  const deploymentGuide = validateString(obj.deploymentGuide);
  if (!deploymentGuide) return null;

  const portfolioDescription = validateString(obj.portfolioDescription);
  if (!portfolioDescription) return null;

  // Grounding: project title must match
  const titleMatch = projectTitle.toLowerCase() === input.projectTitle.toLowerCase() ||
                     projectTitle.toLowerCase().includes(input.projectTitle.toLowerCase()) ||
                     input.projectTitle.toLowerCase().includes(projectTitle.toLowerCase());
  if (!titleMatch) return null;

  // No fake achievements or existing evidence
  const allText = [readme, setupInstructions, testingDocumentation, deploymentGuide, portfolioDescription, repositoryDescription].join(' ');
  if (containsFakeAchievement(allText)) return null;
  if (containsFakeEvidence(allText)) return null;

  return {
    projectTitle,
    repositoryName,
    repositoryDescription,
    folderStructure,
    readme,
    documentation,
    setupInstructions,
    testingDocumentation,
    deploymentGuide,
    portfolioDescription,
  };
}

// ── Response Parsing ─────────────────────────────────────────

/**
 * Parse Gemini's raw text response into a structured object.
 * Handles markdown code fences and JSON formatting.
 */
export function parseDocsPackResponse(text: string): unknown {
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
