/**
 * Test cases for lib/roadmapEngine.ts
 *
 * Run: npx tsx lib/__tests__/roadmapEngine.test.ts
 */

import type {
  CareerProjectBlueprint,
  RoadmapInput,
  CareerDevelopmentRoadmap,
} from '@/types/career';
import {
  buildRoadmapInput,
  validateRoadmap,
  parseRoadmapResponse,
} from '@/lib/roadmapEngine';

// ── Helpers ──────────────────────────────────────────────────

function makeBlueprint(): CareerProjectBlueprint {
  return {
    projectTitle: 'Production REST API with Authentication',
    projectDescription: 'A backend API project with user auth and database integration.',
    relatedGap: 'rest apis',
    objective: 'Build a production-ready REST API that demonstrates authentication, CRUD operations, and database integration.',
    requirements: ['User authentication', 'CRUD API endpoints', 'Database integration', 'Input validation'],
    features: [
      { category: 'Authentication', items: ['Register', 'Login', 'Logout', 'Protected routes'] },
      { category: 'API', items: ['Create resource', 'Read resource', 'Update resource', 'Delete resource'] },
    ],
    architecture: 'Client → REST API → Authentication Layer → Business Logic → Database',
    databaseSchema: {
      entities: [
        { name: 'User', fields: ['id', 'name', 'email', 'passwordHash', 'createdAt'] },
        { name: 'Resource', fields: ['id', 'userId', 'title', 'description', 'createdAt'] },
      ],
      relationships: [{ description: 'User 1 → many Resources' }],
    },
    technologies: [
      { category: 'Language', items: ['TypeScript'] },
      { category: 'Backend', items: ['Node.js', 'Express'] },
      { category: 'Database', items: ['PostgreSQL'] },
    ],
    expectedEvidence: ['REST API implementation', 'Authentication implementation', 'Database integration'],
    developmentTasks: ['1. Init project', '2. Setup DB', '3. Build API', '4. Add auth'],
  };
}

function makeInput(overrides?: Partial<RoadmapInput>): RoadmapInput {
  return {
    projectTitle: 'Production REST API with Authentication',
    relatedGap: 'rest apis',
    objective: 'Build a production-ready REST API that demonstrates authentication, CRUD operations, and database integration.',
    requirements: ['User authentication', 'CRUD API endpoints', 'Database integration', 'Input validation'],
    features: [
      { category: 'Authentication', items: ['Register', 'Login'] },
      { category: 'API', items: ['CRUD endpoints'] },
    ],
    architecture: 'Client → REST API → Auth → Logic → DB',
    databaseSchema: {
      entities: [{ name: 'User', fields: ['id', 'email'] }],
      relationships: [],
    },
    technologies: [{ category: 'Backend', items: ['Node.js'] }],
    expectedEvidence: ['REST API implementation', 'Authentication implementation'],
    skillsToDemonstrate: ['Node.js', 'REST APIs', 'Authentication'],
    ...overrides,
  };
}

function makeValidRawRoadmap(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    projectTitle: 'Production REST API with Authentication',
    relatedGap: 'rest apis',
    objective: 'Build a production-ready REST API that demonstrates authentication, CRUD operations, and database integration.',
    phases: [
      {
        id: 'phase-1',
        title: 'Foundation',
        description: 'Set up project structure and database.',
        order: 1,
        milestones: [
          {
            id: 'milestone-1',
            title: 'Project Setup',
            description: 'Initialize the project and configure development environment.',
            tasks: [
              { id: 'task-1', title: 'Initialize project', description: 'Create project with TypeScript and Express.', order: 1, difficulty: 'Easy', definitionOfDone: 'Project compiles and runs with TypeScript.' },
              { id: 'task-2', title: 'Configure environment', description: 'Set up environment variables and config.', order: 2, difficulty: 'Easy', definitionOfDone: 'Environment config loads correctly.' },
            ],
            skillsDemonstrated: ['TypeScript', 'Node.js'],
            evidenceProduced: ['Project setup and configuration'],
            definitionOfDone: 'Project is initialized and development environment is ready.',
          },
        ],
      },
      {
        id: 'phase-2',
        title: 'Authentication',
        description: 'Implement user authentication system.',
        order: 2,
        milestones: [
          {
            id: 'milestone-2',
            title: 'Authentication Complete',
            description: 'Full authentication with registration and login.',
            tasks: [
              { id: 'task-3', title: 'Create user model', description: 'Define user database model.', order: 1, difficulty: 'Medium', definitionOfDone: 'User model persists to database.' },
              { id: 'task-4', title: 'Implement registration', description: 'Create POST /auth/register endpoint.', order: 2, difficulty: 'Medium', definitionOfDone: 'Users can register via API endpoint.' },
              { id: 'task-5', title: 'Implement login', description: 'Create POST /auth/login endpoint with JWT.', order: 3, difficulty: 'Medium', definitionOfDone: 'Users can log in and receive a token.' },
            ],
            skillsDemonstrated: ['Authentication', 'Security'],
            evidenceProduced: ['Authentication implementation'],
            definitionOfDone: 'Users can register and log in securely.',
          },
        ],
      },
    ],
    totalTasks: 5,
    expectedEvidence: ['REST API implementation', 'Authentication implementation', 'Database integration'],
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

// ── Test 1: Valid blueprint → valid roadmap ──────────────────

test('Valid blueprint → valid roadmap', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  assertEqual(result!.phases.length, 2, 'Should have 2 phases');
  assert(result!.phases[0].milestones.length > 0, 'Phase 1 has milestones');
  assert(result!.phases[1].milestones.length > 0, 'Phase 2 has milestones');
});

// ── Test 2: Roadmap remains linked to selected project ───────

test('Roadmap remains linked to selected project', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  assertEqual(result!.projectTitle, input.projectTitle, 'Project title must match');
});

// ── Test 3: Roadmap remains linked to career gap ─────────────

test('Roadmap remains linked to career gap', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  assertEqual(result!.relatedGap, 'rest apis', 'Gap must match');
});

// ── Test 4: Blueprint requirements appear in roadmap tasks ──

test('Blueprint requirements appear in relevant roadmap tasks', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');

  // Collect all task titles and descriptions
  const allTaskText = result!.phases.flatMap((p) =>
    p.milestones.flatMap((m) =>
      m.tasks.flatMap((t) => [t.title.toLowerCase(), t.description.toLowerCase()]),
    ),
  ).join(' ');

  // At least some requirements should be reflected in the tasks
  const reqKeywords = input.requirements.map((r) => r.toLowerCase());
  const matchesFound = reqKeywords.filter((r) => allTaskText.includes(r.split(' ')[0])).length;
  assert(matchesFound > 0, 'Some blueprint requirements should appear in roadmap tasks');
});

// ── Test 5: Phases are ordered ──────────────────────────────

test('Phases are ordered', () => {
  const input = makeInput();
  const baseRoadmap = makeValidRawRoadmap();
  const phases = baseRoadmap.phases as Record<string, unknown>[];
  const raw = makeValidRawRoadmap({
    phases: [
      { ...phases[1], order: 2 },
      { ...phases[0], order: 1 },
    ],
  });
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  assertEqual(result!.phases[0].order, 1, 'First phase should have order 1');
  assertEqual(result!.phases[1].order, 2, 'Second phase should have order 2');
});

// ── Test 6: Milestones are ordered within phases ────────────

test('Milestones are ordered within phases', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  for (const phase of result!.phases) {
    for (let i = 1; i < phase.milestones.length; i++) {
      assert(
        phase.milestones[i].tasks[0].order >= phase.milestones[i - 1].tasks[0].order,
        'Milestones should be ordered by their first task order',
      );
    }
  }
});

// ── Test 7: Tasks are ordered ───────────────────────────────

test('Tasks are ordered within milestones', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  for (const phase of result!.phases) {
    for (const milestone of phase.milestones) {
      for (let i = 1; i < milestone.tasks.length; i++) {
        assert(
          milestone.tasks[i].order >= milestone.tasks[i - 1].order,
          `Tasks should be ordered: ${milestone.tasks[i - 1].title} before ${milestone.tasks[i].title}`,
        );
      }
    }
  }
});

// ── Test 8: Every milestone has Definition of Done ───────────

test('Every milestone has Definition of Done', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  for (const phase of result!.phases) {
    for (const milestone of phase.milestones) {
      assert(milestone.definitionOfDone.trim().length > 0, `Milestone "${milestone.title}" must have Definition of Done`);
    }
  }
});

// ── Test 9: Every milestone can identify skills demonstrated ─

test('Every milestone can identify skills demonstrated', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');
  // Skills demonstrated is optional (can be empty) but the field must exist
  for (const phase of result!.phases) {
    for (const milestone of phase.milestones) {
      assert(Array.isArray(milestone.skillsDemonstrated), `Milestone "${milestone.title}" must have skillsDemonstrated array`);
    }
  }
});

// ── Test 10: Future evidence is not treated as existing ──────

test('Future evidence is not treated as existing evidence', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap();
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should be valid');

  // Check roadmap-level expectedEvidence
  for (const ev of result!.expectedEvidence) {
    const lower = ev.toLowerCase();
    assert(!lower.includes('you already') && !lower.includes('existing') && !lower.includes('demonstrated'),
      `Evidence "${ev}" should NOT claim existing evidence`);
  }

  // Check milestone-level evidenceProduced
  for (const phase of result!.phases) {
    for (const milestone of phase.milestones) {
      for (const ev of milestone.evidenceProduced) {
        const lower = ev.toLowerCase();
        assert(!lower.includes('you already') && !lower.includes('existing') && !lower.includes('demonstrated'),
          `Milestone evidence "${ev}" should NOT claim existing evidence`);
      }
    }
  }
});

// ── Test 11: Wrong project reference → rejected ─────────────

test('Wrong project reference → rejected', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap({
    projectTitle: 'Machine Learning Pipeline',
    relatedGap: 'machine learning',
  });
  const result = validateRoadmap(raw, input);
  assertEqual(result, null, 'Roadmap for wrong project/gap should be rejected');
});

// ── Test 12: Malformed Gemini JSON → safely rejected ────────

test('Malformed Gemini JSON → safely rejected', () => {
  const input = makeInput();

  const badInputs = [
    null,
    undefined,
    'not an object',
    42,
    [],
    {},
    { projectTitle: '' },
    { projectTitle: 'T', relatedGap: 'g', objective: 'o', phases: [] },
  ];

  for (const bad of badInputs) {
    const result = validateRoadmap(bad, input);
    assertEqual(result, null, `Malformed input should be rejected: ${JSON.stringify(bad ?? 'null').slice(0, 60)}`);
  }
});

// ── Test 13: Missing required fields → rejected ─────────────

test('Missing required fields → rejected', () => {
  const input = makeInput();
  const base = makeValidRawRoadmap();

  const missingCases = [
    { field: 'projectTitle', override: { projectTitle: '' } },
    { field: 'relatedGap', override: { relatedGap: '' } },
    { field: 'objective', override: { objective: '' } },
  ];

  for (const { field, override } of missingCases) {
    const raw = { ...base, ...override };
    const result = validateRoadmap(raw, input);
    assertEqual(result, null, `Missing ${field} → rejected`);
  }
});

// ── Test 14: Invalid difficulty → rejected ──────────────────

test('Invalid difficulty → rejected', () => {
  const input = makeInput();
  const base = makeValidRawRoadmap();

  // Task with invalid difficulty
  const badDiff = JSON.parse(JSON.stringify(base));
  badDiff.phases[0].milestones[0].tasks[0].difficulty = 'Extreme';
  const result = validateRoadmap(badDiff, input);
  // The task should be rejected, but if the milestone still has other valid tasks it may pass
  // If all tasks in a milestone are rejected, the milestone is rejected, and if all milestones
  // in a phase are rejected, the phase is rejected.
  // With only 1 Easy + 1 Easy task in phase 1 milestone, removing one leaves 1 task still valid.
  // Let's make ALL tasks have invalid difficulty:
  const allBad = JSON.parse(JSON.stringify(base));
  for (const phase of allBad.phases) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        task.difficulty = 'Extreme';
      }
    }
  }
  const result2 = validateRoadmap(allBad, input);
  assertEqual(result2, null, 'All tasks with invalid difficulty → rejected');
});

// ── Test 15: totalTasks is validated ─────────────────────────

test('totalTasks is validated', () => {
  const input = makeInput();
  const raw = makeValidRawRoadmap({ totalTasks: 999 });

  const result = validateRoadmap(raw, input);
  assert(result !== null, 'Roadmap should be valid even with wrong totalTasks');
  // The engine counts actual tasks rather than trusting the AI number
  assertEqual(result!.totalTasks, 5, 'totalTasks should reflect actual task count');
});

// ── Test 16: Excessively large roadmap → safely limited ──────

test('Excessively large roadmap → safely limited', () => {
  const input = makeInput();

  // Create 10 phases (over the limit of 8)
  const manyPhases = Array.from({ length: 10 }, (_, i) => ({
    id: `phase-${i + 1}`,
    title: `Phase ${i + 1}`,
    description: `Description ${i + 1}`,
    order: i + 1,
    milestones: [
      {
        id: `milestone-${i + 1}`,
        title: `Milestone ${i + 1}`,
        description: `Milestone desc ${i + 1}`,
        tasks: [
          { id: `task-${i + 1}-1`, title: `Task ${i + 1}-1`, description: 'Do something', order: 1, difficulty: 'Easy', definitionOfDone: 'Done' },
          { id: `task-${i + 1}-2`, title: `Task ${i + 1}-2`, description: 'Do more', order: 2, difficulty: 'Medium', definitionOfDone: 'Done' },
        ],
        skillsDemonstrated: ['Skill'],
        evidenceProduced: ['Evidence'],
        definitionOfDone: 'Milestone done.',
      },
    ],
  }));

  const raw = makeValidRawRoadmap({ phases: manyPhases, totalTasks: 20 });
  const result = validateRoadmap(raw, input);

  assert(result !== null, 'Roadmap should still be valid (just limited)');
  assert(result!.phases.length <= 8, `Should limit to 8 phases, got ${result!.phases.length}`);
});

// ── Test 17: Gemini failure → safe user-facing error ────────

test('Gemini failure → parseRoadmapResponse returns null', () => {
  assertEqual(parseRoadmapResponse(''), null, 'Empty string → null');
  assertEqual(parseRoadmapResponse('not json at all'), null, 'Non-JSON → null');
  assertEqual(parseRoadmapResponse('{broken json'), null, 'Broken JSON → null');
});

// ── Test 18: Regeneration preserves project and gap ──────────

test('Regeneration preserves project and gap relationship', () => {
  const input = makeInput();

  const first = makeValidRawRoadmap({
    objective: 'First objective variant',
    phases: [
      {
        id: 'phase-1',
        title: 'Setup',
        description: 'Initial setup.',
        order: 1,
        milestones: [
          {
            id: 'ms-1',
            title: 'Init',
            description: 'Init project.',
            tasks: [
              { id: 't-1', title: 'Init', description: 'Init.', order: 1, difficulty: 'Easy', definitionOfDone: 'Project inited.' },
            ],
            skillsDemonstrated: ['Node.js'],
            evidenceProduced: ['Project setup'],
            definitionOfDone: 'Project initialized.',
          },
        ],
      },
    ],
    totalTasks: 1,
  });

  const second = makeValidRawRoadmap({
    objective: 'Different objective variant',
    phases: [
      {
        id: 'phase-1',
        title: 'Foundation',
        description: 'Foundation work.',
        order: 1,
        milestones: [
          {
            id: 'ms-1',
            title: 'Project Setup',
            description: 'Setup project.',
            tasks: [
              { id: 't-1', title: 'Init project', description: 'Initialize.', order: 1, difficulty: 'Easy', definitionOfDone: 'Ready.' },
              { id: 't-2', title: 'Configure DB', description: 'Configure database.', order: 2, difficulty: 'Medium', definitionOfDone: 'DB connected.' },
            ],
            skillsDemonstrated: ['TypeScript', 'Node.js'],
            evidenceProduced: ['Project config', 'DB setup'],
            definitionOfDone: 'Project and DB ready.',
          },
        ],
      },
    ],
    totalTasks: 2,
  });

  const result1 = validateRoadmap(first, input);
  const result2 = validateRoadmap(second, input);

  assert(result1 !== null, 'First roadmap valid');
  assert(result2 !== null, 'Second roadmap valid');
  assertEqual(result1!.projectTitle, result2!.projectTitle, 'Same project title on regeneration');
  assertEqual(result1!.relatedGap, result2!.relatedGap, 'Same gap on regeneration');
  // Content can differ
  assert(result1!.phases.length !== result2!.phases.length || result1!.totalTasks !== result2!.totalTasks,
    'Content may differ on regeneration');
});

// ── Bonus: buildRoadmapInput tests ──────────────────────────

test('No blueprint → buildRoadmapInput returns null', () => {
  const result = buildRoadmapInput(null, ['Node.js']);
  assertEqual(result, null, 'No blueprint → null');
});

test('Blueprint with empty title → buildRoadmapInput returns null', () => {
  const bp = makeBlueprint();
  bp.projectTitle = '';
  const result = buildRoadmapInput(bp, ['Node.js']);
  assertEqual(result, null, 'Empty title → null');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
