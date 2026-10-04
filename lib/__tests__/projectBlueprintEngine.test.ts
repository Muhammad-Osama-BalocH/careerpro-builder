/**
 * Test cases for lib/projectBlueprintEngine.ts
 *
 * Run: npx tsx lib/__tests__/projectBlueprintEngine.test.ts
 */

import type {
  CareerProjectIdea,
  CareerGapAnalysis,
  BlueprintInput,
  CareerProjectBlueprint,
} from '@/types/career';
import {
  buildBlueprintInput,
  validateBlueprint,
  parseBlueprintResponse,
} from '@/lib/projectBlueprintEngine';

// ── Helpers ──────────────────────────────────────────────────

function makeIdea(overrides?: Partial<CareerProjectIdea>): CareerProjectIdea {
  return {
    id: 'proj-test-1',
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

function makeInput(overrides?: Partial<BlueprintInput>): BlueprintInput {
  return {
    projectTitle: 'Production REST API with Authentication',
    projectDescription: 'A backend API project with user auth and database integration.',
    relatedGap: 'rest apis',
    skillsToDemonstrate: ['Node.js', 'REST APIs', 'Authentication', 'Database'],
    projectRequirements: ['User authentication', 'CRUD API endpoints', 'Database integration', 'Input validation'],
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react', 'javascript'],
    ...overrides,
  };
}

function makeGapAnalysis(targetRole: string, demonstrated: string[]): CareerGapAnalysis {
  return {
    targetRole,
    requiredSkills: demonstrated.map((s) => ({ skill: s, importance: 'core' as const, description: `${s} skill` })),
    demonstratedSkills: demonstrated,
    gaps: [{ skill: 'rest apis', targetRole, status: 'missing', currentEvidenceLevel: 'none', requiredEvidenceLevel: 'strong', missingEvidence: 'No backend evidence', priority: 'high', relatedEvidenceIds: [] }],
  };
}

function makeValidRawBlueprint(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    projectTitle: 'Production REST API with Authentication',
    projectDescription: 'A production-ready REST API with authentication, CRUD operations, and database integration.',
    relatedGap: 'rest apis',
    objective: 'Build a production-ready REST API that demonstrates authentication, CRUD operations, and database integration.',
    requirements: ['User authentication', 'CRUD API endpoints', 'Database integration', 'Input validation', 'Error handling'],
    features: [
      { category: 'Authentication', items: ['Register', 'Login', 'Logout', 'Protected routes'] },
      { category: 'API', items: ['Create resource', 'Read resource', 'Update resource', 'Delete resource'] },
      { category: 'Security', items: ['Password hashing', 'Authorization', 'Input validation'] },
    ],
    architecture: 'Client → REST API → Authentication Layer → Business Logic → Database',
    databaseSchema: {
      entities: [
        { name: 'User', fields: ['id', 'name', 'email', 'passwordHash', 'createdAt'] },
        { name: 'Resource', fields: ['id', 'userId', 'title', 'description', 'createdAt', 'updatedAt'] },
      ],
      relationships: [
        { description: 'User 1 → many Resources' },
      ],
    },
    developmentTasks: ['1. Initialize project', '2. Configure environment', '3. Create database', '4. Create data models', '5. Implement authentication', '6. Implement API endpoints', '7. Add validation', '8. Add error handling', '9. Add tests'],
    technologies: [
      { category: 'Language', items: ['TypeScript'] },
      { category: 'Backend', items: ['Node.js', 'Express'] },
      { category: 'Database', items: ['PostgreSQL'] },
    ],
    expectedEvidence: ['REST API implementation', 'Authentication implementation', 'Database integration', 'API testing'],
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

// ── Test 1: Valid project idea → valid blueprint ─────────────

test('Valid project idea → valid blueprint', () => {
  const input = makeInput();
  const raw = makeValidRawBlueprint();
  const result = validateBlueprint(raw, input);

  assert(result !== null, 'Blueprint should be valid');
  assertEqual(result!.projectTitle, 'Production REST API with Authentication', 'Title');
  assertEqual(result!.relatedGap, 'rest apis', 'Gap');
  assert(result!.objective.length > 0, 'Objective exists');
  assert(result!.requirements.length > 0, 'Requirements exist');
  assert(result!.features.length > 0, 'Features exist');
  assert(result!.architecture.length > 0, 'Architecture exists');
  assert(result!.databaseSchema.entities.length > 0, 'DB entities exist');
  assert(result!.developmentTasks.length > 0, 'Tasks exist');
  assert(result!.technologies.length > 0, 'Technologies exist');
  assert(result!.expectedEvidence.length > 0, 'Expected evidence exists');
});

// ── Test 2: Blueprint remains linked to selected project ─────

test('Blueprint remains linked to selected project', () => {
  const input = makeInput();
  const raw = makeValidRawBlueprint();
  const result = validateBlueprint(raw, input);

  assert(result !== null, 'Blueprint should be valid');
  assertEqual(result!.projectTitle, input.projectTitle, 'Title must match selected project');
  assertEqual(result!.relatedGap, input.relatedGap, 'Gap must match selected project');
});

// ── Test 3: Blueprint addresses actual career gap ────────────

test('Blueprint addresses actual career gap', () => {
  const input = makeInput();
  const raw = makeValidRawBlueprint();
  const result = validateBlueprint(raw, input);

  assert(result !== null, 'Blueprint should be valid');
  assertEqual(result!.relatedGap, 'rest apis', 'Must reference actual gap');
});

// ── Test 4: Wrong project reference → rejected ──────────────

test('Wrong project reference → rejected', () => {
  const input = makeInput();
  // Blueprint for a completely different project and gap
  const raw = makeValidRawBlueprint({
    projectTitle: 'Machine Learning Pipeline',
    relatedGap: 'machine learning',
    projectDescription: 'An ML pipeline project.',
  });

  const result = validateBlueprint(raw, input);
  assertEqual(result, null, 'Blueprint for wrong project/gap should be rejected');
});

// ── Test 5: Malformed Gemini JSON → safely rejected ─────────

test('Malformed Gemini JSON → safely rejected', () => {
  const input = makeInput();

  const badInputs = [
    {},
    { projectTitle: '' },
    null,
    undefined,
    'not an object',
    42,
    [],
    { projectTitle: 'T', projectDescription: 'D', relatedGap: 'g', objective: 'o', requirements: ['r'], features: [{ category: 'c', items: ['i'] }], architecture: 'a', databaseSchema: { entities: [{ name: 'E', fields: ['f'] }], relationships: [] }, developmentTasks: ['t'], technologies: [{ category: 'c', items: ['i'] }], expectedEvidence: ['e'] },
  ];

  for (const bad of badInputs) {
    const result = validateBlueprint(bad, input);
    if (bad && typeof bad === 'object' && !Array.isArray(bad) && (bad as Record<string, unknown>).projectTitle === 'T') {
      assertEqual(result, null, 'Should reject blueprint with wrong title');
    } else {
      assertEqual(result, null, `Malformed input should be rejected: ${JSON.stringify(bad ?? 'null').slice(0, 60)}`);
    }
  }
});

// ── Test 6: Missing required fields → rejected ──────────────

test('Missing required fields → rejected', () => {
  const input = makeInput();
  const base = makeValidRawBlueprint();

  const missingCases = [
    { field: 'projectTitle', override: { projectTitle: '' } },
    { field: 'projectDescription', override: { projectDescription: '' } },
    { field: 'relatedGap', override: { relatedGap: '' } },
    { field: 'objective', override: { objective: '' } },
    { field: 'architecture', override: { architecture: '' } },
  ];

  for (const { field, override } of missingCases) {
    const raw = { ...base, ...override };
    const result = validateBlueprint(raw, input);
    assertEqual(result, null, `Missing ${field} → rejected`);
  }
});

// ── Test 7: Requirements array handled correctly ─────────────

test('Requirements array handled correctly', () => {
  const input = makeInput();

  // Empty requirements → rejected
  const emptyReqs = makeValidRawBlueprint({ requirements: [] });
  assertEqual(validateBlueprint(emptyReqs, input), null, 'Empty requirements → rejected');

  // Non-array requirements → rejected
  const notArray = makeValidRawBlueprint({ requirements: 'not an array' });
  assertEqual(validateBlueprint(notArray, input), null, 'Non-array requirements → rejected');

  // Valid requirements → accepted
  const valid = makeValidRawBlueprint({ requirements: ['Auth', 'CRUD'] });
  const result = validateBlueprint(valid, input);
  assert(result !== null, 'Valid requirements → accepted');
  assertEqual(result!.requirements.length, 2, 'Correct requirement count');
});

// ── Test 8: Features array handled correctly ─────────────────

test('Features array handled correctly', () => {
  const input = makeInput();

  // Empty features → rejected
  const emptyFeats = makeValidRawBlueprint({ features: [] });
  assertEqual(validateBlueprint(emptyFeats, input), null, 'Empty features → rejected');

  // Features with missing category → group skipped
  const badCategory = makeValidRawBlueprint({ features: [{ items: ['a'] }, { category: 'Valid', items: ['b'] }] });
  const result1 = validateBlueprint(badCategory, input);
  assert(result1 !== null, 'Features with invalid group still accepted if valid groups exist');
  assertEqual(result1!.features.length, 1, 'Invalid feature group skipped');

  // Features with missing items → group skipped
  const badItems = makeValidRawBlueprint({ features: [{ category: 'Bad' }, { category: 'Valid', items: ['x'] }] });
  const result2 = validateBlueprint(badItems, input);
  assert(result2 !== null, 'Features with missing items still accepted if valid groups exist');
  assertEqual(result2!.features.length, 1, 'Feature group with no items skipped');
});

// ── Test 9: Database schema validation ──────────────────────

test('Database schema validation', () => {
  const input = makeInput();

  // No entities → rejected
  const noEntities = makeValidRawBlueprint({ databaseSchema: { entities: [], relationships: [] } });
  assertEqual(validateBlueprint(noEntities, input), null, 'No DB entities → rejected');

  // Entity with missing name → skipped
  const badEntity = makeValidRawBlueprint({ databaseSchema: { entities: [{ fields: ['id'] }, { name: 'User', fields: ['id', 'name'] }], relationships: [] } });
  const result1 = validateBlueprint(badEntity, input);
  assert(result1 !== null, 'Schema with invalid entity still accepted if valid entities exist');
  assertEqual(result1!.databaseSchema.entities.length, 1, 'Invalid entity skipped');

  // Entity with missing fields → skipped
  const badFields = makeValidRawBlueprint({ databaseSchema: { entities: [{ name: 'Bad' }, { name: 'User', fields: ['id'] }], relationships: [] } });
  const result2 = validateBlueprint(badFields, input);
  assert(result2 !== null, 'Schema with entity missing fields still accepted');
  assertEqual(result2!.databaseSchema.entities.length, 1, 'Entity with no fields skipped');

  // Relationships are optional (can be empty)
  const noRels = makeValidRawBlueprint({ databaseSchema: { entities: [{ name: 'User', fields: ['id'] }], relationships: [] } });
  const result3 = validateBlueprint(noRels, input);
  assert(result3 !== null, 'Schema with no relationships → accepted');
  assertEqual(result3!.databaseSchema.relationships.length, 0, 'No relationships is ok');

  // Invalid databaseSchema type → rejected
  const badSchema = makeValidRawBlueprint({ databaseSchema: 'not an object' });
  assertEqual(validateBlueprint(badSchema, input), null, 'Non-object databaseSchema → rejected');
});

// ── Test 10: Development tasks validation ────────────────────

test('Development tasks validation', () => {
  const input = makeInput();

  // Empty tasks → rejected
  const empty = makeValidRawBlueprint({ developmentTasks: [] });
  assertEqual(validateBlueprint(empty, input), null, 'Empty tasks → rejected');

  // Non-array tasks → rejected
  const notArray = makeValidRawBlueprint({ developmentTasks: 'do stuff' });
  assertEqual(validateBlueprint(notArray, input), null, 'Non-array tasks → rejected');

  // Valid tasks → accepted
  const valid = makeValidRawBlueprint({ developmentTasks: ['1. Init project', '2. Setup DB', '3. Build API'] });
  const result = validateBlueprint(valid, input);
  assert(result !== null, 'Valid tasks → accepted');
  assertEqual(result!.developmentTasks.length, 3, 'Correct task count');
});

// ── Test 11: Future evidence is not treated as existing ──────

test('Future evidence is not treated as existing evidence', () => {
  const input = makeInput();
  const raw = makeValidRawBlueprint();
  const result = validateBlueprint(raw, input);

  assert(result !== null, 'Blueprint should be valid');

  for (const ev of result!.expectedEvidence) {
    const lower = ev.toLowerCase();
    assert(!lower.includes('you already') && !lower.includes('existing') && !lower.includes('demonstrated'),
      `Evidence "${ev}" should NOT claim existing evidence`);
  }

  // Verify the model has no fields that imply existing evidence
  const keys = Object.keys(result!);
  assert(!keys.includes('existingEvidence'), 'Must not have existingEvidence field');
  assert(!keys.includes('currentEvidence'), 'Must not have currentEvidence field');
  assert(!keys.includes('confidence'), 'Must not have confidence field');
});

// ── Test 12: No target career → safe behavior ───────────────

test('No target career → buildBlueprintInput returns null', () => {
  const idea = makeIdea();
  const gapAnalysis = makeGapAnalysis('', []);
  const result = buildBlueprintInput(idea, gapAnalysis);
  assertEqual(result, null, 'No target role → null');
});

// ── Test 13: No project selected → safe behavior ────────────

test('No project selected → buildBlueprintInput returns null', () => {
  const gapAnalysis = makeGapAnalysis('full-stack developer', ['react']);
  const result = buildBlueprintInput(null, gapAnalysis);
  assertEqual(result, null, 'No project selected → null');

  // Also test with empty-title idea
  const emptyIdea = makeIdea({ title: '' });
  const result2 = buildBlueprintInput(emptyIdea, gapAnalysis);
  assertEqual(result2, null, 'Empty title idea → null');
});

// ── Test 14: Gemini failure → safe error ────────────────────

test('Gemini failure → parseBlueprintResponse returns null', () => {
  assertEqual(parseBlueprintResponse(''), null, 'Empty string → null');
  assertEqual(parseBlueprintResponse('not json at all'), null, 'Non-JSON → null');
  assertEqual(parseBlueprintResponse('{broken json'), null, 'Broken JSON → null');
});

// ── Test 15: Regeneration keeps the same project/gap ────────

test('Regeneration keeps the same project/gap relationship', () => {
  const input = makeInput();

  // Simulate two different Gemini responses for the same project
  const first = makeValidRawBlueprint({
    objective: 'First objective',
    architecture: 'Client → API → DB',
    developmentTasks: ['1. Init', '2. Build'],
  });

  const second = makeValidRawBlueprint({
    objective: 'Different objective',
    architecture: 'Client → API → Auth → Service → DB',
    developmentTasks: ['1. Setup', '2. Models', '3. API', '4. Auth'],
  });

  const result1 = validateBlueprint(first, input);
  const result2 = validateBlueprint(second, input);

  assert(result1 !== null, 'First blueprint valid');
  assert(result2 !== null, 'Second blueprint valid');

  // Both must reference the same project and gap
  assertEqual(result1!.projectTitle, result2!.projectTitle, 'Same project title on regeneration');
  assertEqual(result1!.relatedGap, result2!.relatedGap, 'Same gap on regeneration');

  // Content can differ
  assert(result1!.objective !== result2!.objective || result1!.architecture !== result2!.architecture,
    'Content may differ on regeneration');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
