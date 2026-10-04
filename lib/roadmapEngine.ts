import type {
  CareerProjectBlueprint,
  CareerDevelopmentRoadmap,
  RoadmapInput,
  RoadmapPhase,
  RoadmapMilestone,
  RoadmapTask,
  TaskDifficulty,
} from '@/types/career';

/**
 * Roadmap Engine — Phase 8F-3A
 *
 * Converts a Technical Blueprint into an actionable Development Roadmap.
 * Every roadmap must originate from a selected CareerProjectBlueprint.
 *
 * AI generates: phases, milestones, tasks, definitions of done, skills, evidence.
 * AI must NOT: invent user achievements, claim existing evidence, modify scores,
 *   or generate a roadmap for an unrelated project.
 */

// ── Limits ───────────────────────────────────────────────────

const MAX_PHASES = 8;
const MAX_MILESTONES_PER_PHASE = 8;
const MAX_TASKS_PER_MILESTONE = 15;
const VALID_DIFFICULTIES: TaskDifficulty[] = ['Easy', 'Medium', 'Hard'];

// ── Input Builder ────────────────────────────────────────────

/**
 * Build structured roadmap input from a selected blueprint.
 * Returns null if the blueprint is invalid or missing.
 */
export function buildRoadmapInput(
  blueprint: CareerProjectBlueprint | null,
  skillsToDemonstrate: string[],
): RoadmapInput | null {
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

function validateDifficulty(value: unknown): TaskDifficulty | null {
  if (typeof value !== 'string') return null;
  const capped = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  if (VALID_DIFFICULTIES.includes(capped as TaskDifficulty)) return capped as TaskDifficulty;
  return null;
}

function validateTask(raw: unknown, index: number): RoadmapTask | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const title = validateString(obj.title);
  if (!title) return null;

  const description = validateString(obj.description);
  if (!description) return null;

  const order = typeof obj.order === 'number' && obj.order > 0 ? obj.order : index + 1;

  const difficulty = validateDifficulty(obj.difficulty);
  if (!difficulty) return null;

  const definitionOfDone = validateString(obj.definitionOfDone);
  if (!definitionOfDone) return null;

  const id = validateString(obj.id) || `task-${Date.now()}-${index}`;

  return { id, title, description, order, difficulty, definitionOfDone };
}

function validateMilestone(raw: unknown, phaseIndex: number, mileIndex: number): RoadmapMilestone | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const title = validateString(obj.title);
  if (!title) return null;

  const description = validateString(obj.description);
  if (!description) return null;

  if (!Array.isArray(obj.tasks) || obj.tasks.length === 0) return null;
  const tasks: RoadmapTask[] = [];
  for (let t = 0; t < Math.min(obj.tasks.length, MAX_TASKS_PER_MILESTONE); t++) {
    const task = validateTask(obj.tasks[t], t);
    if (task) tasks.push(task);
  }
  if (tasks.length === 0) return null;

  const skillsDemonstrated = validateStringArray(obj.skillsDemonstrated) || [];
  const evidenceProduced = validateStringArray(obj.evidenceProduced) || [];

  const definitionOfDone = validateString(obj.definitionOfDone);
  if (!definitionOfDone) return null;

  const id = validateString(obj.id) || `milestone-${phaseIndex}-${mileIndex}`;

  // Sort tasks by order
  tasks.sort((a, b) => a.order - b.order);

  return { id, title, description, tasks, skillsDemonstrated, evidenceProduced, definitionOfDone };
}

function validatePhase(raw: unknown, phaseIndex: number): RoadmapPhase | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const title = validateString(obj.title);
  if (!title) return null;

  const description = validateString(obj.description);
  if (!description) return null;

  const order = typeof obj.order === 'number' && obj.order > 0 ? obj.order : phaseIndex + 1;

  if (!Array.isArray(obj.milestones) || obj.milestones.length === 0) return null;
  const milestones: RoadmapMilestone[] = [];
  for (let m = 0; m < Math.min(obj.milestones.length, MAX_MILESTONES_PER_PHASE); m++) {
    const milestone = validateMilestone(obj.milestones[m], phaseIndex, m);
    if (milestone) milestones.push(milestone);
  }
  if (milestones.length === 0) return null;

  const id = validateString(obj.id) || `phase-${phaseIndex + 1}`;

  // Sort milestones by their task orders (first task order as proxy)
  milestones.sort((a, b) => {
    const aOrder = a.tasks[0]?.order ?? 0;
    const bOrder = b.tasks[0]?.order ?? 0;
    return aOrder - bOrder;
  });

  return { id, title, description, order, milestones };
}

// ── Blueprint Validation ─────────────────────────────────────

/**
 * Validate a raw Gemini roadmap object.
 * Returns the validated CareerDevelopmentRoadmap or null if invalid.
 */
export function validateRoadmap(
  raw: unknown,
  input: RoadmapInput,
): CareerDevelopmentRoadmap | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  const projectTitle = validateString(obj.projectTitle);
  if (!projectTitle) return null;

  const relatedGap = validateString(obj.relatedGap);
  if (!relatedGap) return null;

  const objective = validateString(obj.objective);
  if (!objective) return null;

  // Grounding: relatedGap must match the blueprint's gap
  const gapMatch = relatedGap.toLowerCase() === input.relatedGap.toLowerCase() ||
                   relatedGap.toLowerCase().includes(input.relatedGap.toLowerCase()) ||
                   input.relatedGap.toLowerCase().includes(relatedGap.toLowerCase());
  if (!gapMatch) return null;

  if (!Array.isArray(obj.phases) || obj.phases.length === 0) return null;
  const phases: RoadmapPhase[] = [];
  for (let p = 0; p < Math.min(obj.phases.length, MAX_PHASES); p++) {
    const phase = validatePhase(obj.phases[p], p);
    if (phase) phases.push(phase);
  }
  if (phases.length === 0) return null;

  // Sort phases by order
  phases.sort((a, b) => a.order - b.order);

  // Count total tasks
  const totalTasks = phases.reduce(
    (sum, phase) => sum + phase.milestones.reduce(
      (ms, milestone) => ms + milestone.tasks.length, 0,
    ), 0,
  );

  const expectedEvidence = validateStringArray(obj.expectedEvidence) || input.expectedEvidence;

  return {
    projectTitle,
    relatedGap,
    objective,
    phases,
    totalTasks,
    expectedEvidence,
  };
}

// ── Response Parsing ─────────────────────────────────────────

/**
 * Parse Gemini's raw text response into a structured object.
 * Handles markdown code fences and JSON formatting.
 */
export function parseRoadmapResponse(text: string): unknown {
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
