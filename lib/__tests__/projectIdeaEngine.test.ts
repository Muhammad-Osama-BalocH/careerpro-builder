/**
 * Test cases for lib/projectIdeaEngine.ts
 *
 * Run: npx tsx lib/__tests__/projectIdeaEngine.test.ts
 */

import type {
  CareerGapAnalysis,
  ProjectIdeasInput,
  CareerProjectIdea,
} from '@/types/career';
import {
  buildProjectIdeasInput,
  validateProjectIdeas,
  parseProjectIdeasResponse,
} from '@/lib/projectIdeaEngine';

// ── Helpers ──────────────────────────────────────────────────

function makeGapAnalysis(
  targetRole: string,
  demonstrated: string[],
  gaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>,
): CareerGapAnalysis {
  return {
    targetRole,
    requiredSkills: [
      ...demonstrated.map((s) => ({ skill: s, importance: 'core' as const, description: `${s} skill` })),
      ...gaps.map((g) => ({ skill: g.skill, importance: 'core' as const, description: `${g.skill} skill` })),
    ],
    demonstratedSkills: demonstrated,
    gaps: gaps.map((g) => ({
      skill: g.skill,
      targetRole,
      status: g.status as 'missing',
      currentEvidenceLevel: 'none' as const,
      requiredEvidenceLevel: 'strong' as const,
      missingEvidence: g.missingEvidence,
      priority: g.priority as 'high',
      relatedEvidenceIds: [],
    })),
  };
}

function makeValidRawIdea(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    title: 'Production REST API with Authentication',
    shortDescription: 'A backend API project with user auth and database integration.',
    problem: 'Your profile lacks backend evidence for API development and authentication.',
    whyThisProject: 'This project directly addresses your backend gap by proving API design and auth skills.',
    relatedGap: 'rest apis',
    priority: 'high',
    skillsToDemonstrate: ['Node.js', 'REST APIs', 'Authentication', 'Database'],
    evidenceToCreate: ['Backend project', 'API endpoints', 'Authentication implementation', 'Database integration'],
    requirements: ['User authentication', 'CRUD API endpoints', 'Database integration', 'Input validation'],
    ...overrides,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passCount++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failCount++;
    console.log(`  ❌ ${name}`);
    if (err instanceof Error) console.log(`     ${err.message}`);
  }
}

// ── Test 1: High-priority gap → relevant project idea ────────

test('High-priority gap → relevant project idea', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No backend evidence' },
    ],
    demonstratedSkills: ['react', 'javascript'],
    existingProjectCount: 2,
    existingProjectNames: ['Portfolio Site', 'Todo App'],
  };

  const rawIdeas = [makeValidRawIdea()];
  const results = validateProjectIdeas(rawIdeas, input);

  assertEqual(results.length, 1, 'Should produce 1 project idea');
  assertEqual(results[0].priority, 'high', 'Project priority should be high');
  assertEqual(results[0].relatedGap, 'rest apis', 'Should reference the gap');
  assert(results[0].skillsToDemonstrate.length > 0, 'Should list skills to demonstrate');
  assert(results[0].evidenceToCreate.length > 0, 'Should list evidence to create');
  assert(results[0].requirements.length > 0, 'Should list requirements');
});

// ── Test 2: Medium-priority gap → relevant project idea ──────

test('Medium-priority gap → relevant project idea', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'frontend developer',
    careerGaps: [
      { skill: 'testing', status: 'missing', priority: 'medium', missingEvidence: 'No testing evidence' },
    ],
    demonstratedSkills: ['react', 'javascript', 'html', 'css'],
    existingProjectCount: 3,
    existingProjectNames: ['Portfolio'],
  };

  const rawIdeas = [makeValidRawIdea({
    title: 'Test-Driven Frontend Component Library',
    shortDescription: 'A component library built with comprehensive tests.',
    problem: 'No testing evidence exists in your profile.',
    whyThisProject: 'Adding tests demonstrates quality practices.',
    relatedGap: 'testing',
    priority: 'medium',
    skillsToDemonstrate: ['Testing', 'React', 'Jest'],
    evidenceToCreate: ['Test suite', 'Test coverage report'],
    requirements: ['Unit tests for all components', 'Integration tests'],
  })];

  const results = validateProjectIdeas(rawIdeas, input);
  assertEqual(results.length, 1, 'Should produce 1 project idea');
  assertEqual(results[0].priority, 'medium', 'Project priority should be medium');
  assertEqual(results[0].relatedGap, 'testing', 'Should reference testing gap');
});

// ── Test 3: Multiple gaps → maximum 3 ideas ─────────────────

test('Multiple gaps → limited to 3 project ideas', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No API evidence' },
      { skill: 'authentication', status: 'missing', priority: 'high', missingEvidence: 'No auth evidence' },
      { skill: 'databases', status: 'missing', priority: 'high', missingEvidence: 'No DB evidence' },
      { skill: 'deployment', status: 'missing', priority: 'medium', missingEvidence: 'No deploy evidence' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['Frontend App'],
  };

  const rawIdeas = Array.from({ length: 5 }, (_, i) => makeValidRawIdea({
    title: `Project ${i}`,
    relatedGap: input.careerGaps[i % input.careerGaps.length].skill,
  }));

  const results = validateProjectIdeas(rawIdeas, input);
  assert(results.length <= 3, `Should limit to 3 project ideas, got ${results.length}`);
});

// ── Test 4: Project idea must reference an actual gap ────────

test('Project idea must reference an actual gap (grounding)', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'frontend developer',
    careerGaps: [
      { skill: 'html', status: 'missing', priority: 'high', missingEvidence: 'No HTML' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['App'],
  };

  // Project about a gap that doesn't exist
  const ungroundedIdea = makeValidRawIdea({
    title: 'Machine Learning Pipeline',
    relatedGap: 'machine learning',
    skillsToDemonstrate: ['Python', 'TensorFlow'],
    evidenceToCreate: ['ML model'],
    requirements: ['Data collection', 'Model training'],
  });

  const results = validateProjectIdeas([ungroundedIdea], input);
  assertEqual(results.length, 0, 'Ungrounded project idea should be rejected');
});

// ── Test 5: Unknown/ungrounded gap → project rejected ───────

test('Ungrounded project referencing non-existent gap is rejected', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'backend developer',
    careerGaps: [
      { skill: 'databases', status: 'missing', priority: 'high', missingEvidence: 'No DB evidence' },
    ],
    demonstratedSkills: ['node.js'],
    existingProjectCount: 0,
    existingProjectNames: [],
  };

  const idea = makeValidRawIdea({
    relatedGap: 'photoshop',
    title: 'Design Portfolio',
    skillsToDemonstrate: ['Photoshop'],
    evidenceToCreate: ['Design files'],
    requirements: ['Create mockups'],
  });

  const results = validateProjectIdeas([idea], input);
  assertEqual(results.length, 0, 'Project for non-existent gap should be rejected');
});

// ── Test 6: Malformed Gemini JSON → safely rejected ─────────

test('Malformed Gemini JSON → safely rejected', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['App'],
  };

  const badInputs = [
    {},
    { title: '' },
    { title: 'T', shortDescription: '' },
    { title: 'T', shortDescription: 'D', problem: '', whyThisProject: 'W', relatedGap: 'rest apis', priority: 'high', skillsToDemonstrate: ['s'], evidenceToCreate: ['e'], requirements: ['r'] },
    { title: 'T', shortDescription: 'D', problem: 'P', whyThisProject: 'W', relatedGap: 'rest apis', priority: 'invalid', skillsToDemonstrate: ['s'], evidenceToCreate: ['e'], requirements: ['r'] },
    { title: 'T', shortDescription: 'D', problem: 'P', whyThisProject: 'W', relatedGap: 'rest apis', priority: 'high', skillsToDemonstrate: [], evidenceToCreate: ['e'], requirements: ['r'] },
    { title: 'T', shortDescription: 'D', problem: 'P', whyThisProject: 'W', relatedGap: 'rest apis', priority: 'high', skillsToDemonstrate: ['s'], evidenceToCreate: [], requirements: ['r'] },
    { title: 'T', shortDescription: 'D', problem: 'P', whyThisProject: 'W', relatedGap: 'rest apis', priority: 'high', skillsToDemonstrate: ['s'], evidenceToCreate: ['e'], requirements: [] },
    'not an object',
    42,
    null,
  ];

  for (const bad of badInputs) {
    const results = validateProjectIdeas([bad], input);
    assertEqual(results.length, 0, `Malformed input should be rejected: ${JSON.stringify(bad).slice(0, 60)}`);
  }
});

// ── Test 7: Missing required fields → rejected ──────────────

test('Missing required fields → rejected individually', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['App'],
  };

  const base = makeValidRawIdea();

  // Missing title
  const noTitle = { ...base, title: '' };
  assertEqual(validateProjectIdeas([noTitle], input).length, 0, 'Missing title → rejected');

  // Missing shortDescription
  const noDesc = { ...base, shortDescription: '' };
  assertEqual(validateProjectIdeas([noDesc], input).length, 0, 'Missing shortDescription → rejected');

  // Missing problem
  const noProblem = { ...base, problem: '' };
  assertEqual(validateProjectIdeas([noProblem], input).length, 0, 'Missing problem → rejected');

  // Missing whyThisProject
  const noWhy = { ...base, whyThisProject: '' };
  assertEqual(validateProjectIdeas([noWhy], input).length, 0, 'Missing whyThisProject → rejected');

  // Missing relatedGap
  const noGap = { ...base, relatedGap: '' };
  assertEqual(validateProjectIdeas([noGap], input).length, 0, 'Missing relatedGap → rejected');
});

// ── Test 8: No target career → no project ideas ─────────────

test('No target career → buildProjectIdeasInput returns null', () => {
  const gapAnalysis = makeGapAnalysis('', [], []);
  const result = buildProjectIdeasInput(gapAnalysis, [], 0, []);
  assertEqual(result, null, 'No target role → null');
});

// ── Test 9: No career gaps → no project ideas ───────────────

test('No career gaps → buildProjectIdeasInput returns null', () => {
  const gapAnalysis = makeGapAnalysis('frontend developer', ['react', 'javascript'], []);
  const result = buildProjectIdeasInput(gapAnalysis, [], 2, ['Portfolio']);
  assertEqual(result, null, 'No gaps → null');
});

// ── Test 10: Existing evidence is NOT presented as newly created ──

test('Evidence to create describes future evidence, not existing', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No backend evidence' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['Frontend App'],
  };

  const rawIdeas = [makeValidRawIdea()];
  const results = validateProjectIdeas(rawIdeas, input);

  assertEqual(results.length, 1, 'Should produce 1 project idea');

  // Verify evidenceToCreate uses forward-looking language
  for (const idea of results) {
    for (const ev of idea.evidenceToCreate) {
      // Must NOT claim user already has this evidence
      const lower = ev.toLowerCase();
      assert(!lower.includes('you already') && !lower.includes('existing') && !lower.includes('demonstrated'),
        `Evidence "${ev}" should NOT claim existing evidence`);
    }
  }

  // Verify the model has no fields that could be confused with existing evidence
  const idea = results[0];
  const keys = Object.keys(idea);
  assert(!keys.includes('existingEvidence'), 'Must not have existingEvidence field');
  assert(!keys.includes('currentEvidence'), 'Must not have currentEvidence field');
  assert(!keys.includes('confidence'), 'Must not have confidence field');
});

// ── Test 11: buildProjectIdeasInput builds correct structure ──

test('buildProjectIdeasInput builds correct structured input', () => {
  const gapAnalysis = makeGapAnalysis('full-stack developer', ['react', 'javascript'], [
    { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No API evidence' },
    { skill: 'databases', status: 'missing', priority: 'high', missingEvidence: 'No DB evidence' },
  ]);

  const result = buildProjectIdeasInput(gapAnalysis, [], 2, ['Frontend App', 'Todo App']);

  assert(result != null, 'Input should not be null');
  assertEqual(result!.targetRole, 'full-stack developer', 'Target role');
  assertEqual(result!.careerGaps.length, 2, 'Should include 2 gaps');
  assertEqual(result!.demonstratedSkills.length, 2, 'Should include 2 demonstrated skills');
  assertEqual(result!.existingProjectCount, 2, 'Project count');
  assertEqual(result!.existingProjectNames.length, 2, 'Project names');
});

// ── Test 12: parseProjectIdeasResponse handles edge cases ────

test('parseProjectIdeasResponse handles edge cases', () => {
  assertEqual(parseProjectIdeasResponse('').length, 0, 'Empty string → empty');
  assertEqual(parseProjectIdeasResponse('not json').length, 0, 'Non-JSON → empty');
  assertEqual(parseProjectIdeasResponse('{"not":"array"}').length, 0, 'JSON object → empty');
  assertEqual(parseProjectIdeasResponse('```json\n[{"title":"Test"}]\n```').length, 1, 'Markdown fences → parsed');
});

// ── Test 13: Priority sorting works ─────────────────────────

test('Project ideas sorted by priority (high first)', () => {
  const input: ProjectIdeasInput = {
    targetRole: 'full-stack developer',
    careerGaps: [
      { skill: 'testing', status: 'missing', priority: 'medium', missingEvidence: 'No tests' },
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No APIs' },
      { skill: 'deployment', status: 'missing', priority: 'low', missingEvidence: 'No deploy' },
    ],
    demonstratedSkills: ['react'],
    existingProjectCount: 1,
    existingProjectNames: ['App'],
  };

  const rawIdeas = [
    makeValidRawIdea({ relatedGap: 'deployment', priority: 'low', title: 'Deploy Project' }),
    makeValidRawIdea({ relatedGap: 'rest apis', priority: 'high', title: 'API Project' }),
    makeValidRawIdea({ relatedGap: 'testing', priority: 'medium', title: 'Test Project' }),
  ];

  const results = validateProjectIdeas(rawIdeas, input);
  assertEqual(results.length, 3, 'Should have 3 ideas');
  assertEqual(results[0].priority, 'high', 'First should be high');
  assertEqual(results[1].priority, 'medium', 'Second should be medium');
  assertEqual(results[2].priority, 'low', 'Third should be low');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
