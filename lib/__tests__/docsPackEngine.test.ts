/**
 * Test cases for lib/docsPackEngine.ts
 *
 * Run: npx tsx lib/__tests__/docsPackEngine.test.ts
 */

import type {
  DocsInput,
  CareerProjectDocumentationPack,
} from '@/types/career';
import {
  buildDocsInput,
  validateDocsPack,
  parseDocsPackResponse,
} from '@/lib/docsPackEngine';

// ── Helpers ──────────────────────────────────────────────────

function makeInput(overrides?: Partial<DocsInput>): DocsInput {
  return {
    projectTitle: 'Production REST API with Authentication',
    relatedGap: 'rest apis',
    objective: 'Build a production-ready REST API with authentication and database integration.',
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
    skillsToDemonstrate: ['Node.js', 'REST APIs', 'Authentication'],
    phaseCount: 5,
    totalTasks: 20,
    ...overrides,
  };
}

function makeValidRawPack(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    projectTitle: 'Production REST API with Authentication',
    repositoryName: 'production-rest-api',
    repositoryDescription: 'A production-ready REST API with authentication, CRUD operations, and database integration.',
    folderStructure: 'production-rest-api/\n├── src/\n│   ├── controllers/\n│   ├── routes/\n│   ├── models/\n│   └── middleware/\n├── tests/\n├── .env.example\n├── README.md\n├── package.json\n└── tsconfig.json',
    readme: '# Production REST API with Authentication\n\nA production-ready REST API demonstrating authentication, CRUD operations, and database integration.\n\n## Problem\nLack of backend evidence.\n\n## Features\n- Authentication\n- CRUD endpoints\n- Database integration\n\n## Technologies\n- TypeScript\n- Node.js\n- Express\n- PostgreSQL\n\n## Setup\n1. Clone repo\n2. Install dependencies\n3. Configure .env\n4. Run migrations\n5. Start server',
    documentation: ['architecture.md', 'api.md', 'database.md', 'authentication.md', 'testing.md', 'deployment.md'],
    setupInstructions: '1. Install Node.js 18+\n2. Clone the repository\n3. Run npm install\n4. Copy .env.example to .env\n5. Set up PostgreSQL database\n6. Run migrations\n7. Start with npm run dev',
    testingDocumentation: 'Test the API endpoints, authentication flows, and database operations. Use Jest for unit tests and Supertest for integration tests.',
    deploymentGuide: '1. Configure production environment variables\n2. Set up production PostgreSQL database\n3. Build with npm run build\n4. Deploy to hosting provider\n5. Verify API endpoints\n6. Configure monitoring',
    portfolioDescription: 'Production-ready REST API demonstrating authentication, database integration, validation, and secure CRUD operations.',
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

// ── Test 1: Valid project → valid documentation pack ────────

test('Valid project → valid documentation pack', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assertEqual(result!.projectTitle, 'Production REST API with Authentication', 'Title');
  assert(result!.repositoryName.length > 0, 'Repository name exists');
  assert(result!.readme.length > 100, 'README is substantial');
  assert(result!.documentation.length > 0, 'Documentation files listed');
});

// ── Test 2: Pack remains linked to selected project ──────────

test('Pack remains linked to selected project', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assertEqual(result!.projectTitle, input.projectTitle, 'Project title must match');
});

// ── Test 3: Technologies match blueprint ────────────────────

test('Technologies in pack are consistent with blueprint', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  const readmeLower = result!.readme.toLowerCase();
  const setupLower = result!.setupInstructions.toLowerCase();

  // At least some blueprint technologies should be mentioned
  const techNames = input.technologies.flatMap((t) => t.items);
  const foundTechs = techNames.filter((t) => readmeLower.includes(t.toLowerCase()) || setupLower.includes(t.toLowerCase()));
  assert(foundTechs.length > 0, 'Some blueprint technologies should appear in README/setup');
});

// ── Test 4: Features do not contradict blueprint ─────────────

test('Features in pack do not contradict blueprint', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  // Pack should not list features unrelated to the blueprint
  const readmeLower = result!.readme.toLowerCase();
  assert(!readmeLower.includes('blockchain'), 'Should not add blockchain');
  assert(!readmeLower.includes('machine learning'), 'Should not add ML');
  assert(!readmeLower.includes('mobile app'), 'Should not add mobile app');
});

// ── Test 5: Repository structure is present ──────────────────

test('Repository structure is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.folderStructure.length > 0, 'Folder structure exists');
  assert(result!.folderStructure.includes('src') || result!.folderStructure.includes('├'), 'Folder structure looks like a tree');
});

// ── Test 6: README is present ───────────────────────────────

test('README is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.readme.length > 50, 'README has substantial content');
});

// ── Test 7: Documentation structure is present ───────────────

test('Documentation structure is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.documentation.length > 0, 'Documentation files listed');
  // Files should end with .md
  assert(result!.documentation.every((f) => f.endsWith('.md')), 'All docs are markdown files');
});

// ── Test 8: Setup instructions are present ──────────────────

test('Setup instructions are present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.setupInstructions.length > 0, 'Setup instructions exist');
});

// ── Test 9: Testing documentation is present ─────────────────

test('Testing documentation is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.testingDocumentation.length > 0, 'Testing docs exist');
});

// ── Test 10: Deployment guide is present ─────────────────────

test('Deployment guide is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.deploymentGuide.length > 0, 'Deployment guide exists');
});

// ── Test 11: Portfolio description is present ────────────────

test('Portfolio description is present', () => {
  const input = makeInput();
  const raw = makeValidRawPack();
  const result = validateDocsPack(raw, input);

  assert(result !== null, 'Pack should be valid');
  assert(result!.portfolioDescription.length > 0, 'Portfolio description exists');
});

// ── Test 12: Malformed Gemini response → rejected ───────────

test('Malformed Gemini response → rejected', () => {
  const input = makeInput();

  const badInputs = [
    null,
    undefined,
    'not an object',
    42,
    [],
    {},
    { projectTitle: '' },
  ];

  for (const bad of badInputs) {
    const result = validateDocsPack(bad, input);
    assertEqual(result, null, `Malformed input should be rejected: ${JSON.stringify(bad ?? 'null').slice(0, 60)}`);
  }
});

// ── Test 13: Missing required fields → rejected ─────────────

test('Missing required fields → rejected', () => {
  const input = makeInput();
  const base = makeValidRawPack();

  const missingCases = [
    { field: 'projectTitle', override: { projectTitle: '' } },
    { field: 'repositoryName', override: { repositoryName: '' } },
    { field: 'repositoryDescription', override: { repositoryDescription: '' } },
    { field: 'folderStructure', override: { folderStructure: '' } },
    { field: 'readme', override: { readme: '' } },
    { field: 'documentation', override: { documentation: [] } },
    { field: 'setupInstructions', override: { setupInstructions: '' } },
    { field: 'testingDocumentation', override: { testingDocumentation: '' } },
    { field: 'deploymentGuide', override: { deploymentGuide: '' } },
    { field: 'portfolioDescription', override: { portfolioDescription: '' } },
  ];

  for (const { field, override } of missingCases) {
    const raw = { ...base, ...override };
    const result = validateDocsPack(raw, input);
    assertEqual(result, null, `Missing ${field} → rejected`);
  }
});

// ── Test 14: Wrong project → rejected ───────────────────────

test('Wrong project → rejected', () => {
  const input = makeInput();
  const raw = makeValidRawPack({
    projectTitle: 'Machine Learning Pipeline',
    repositoryName: 'ml-pipeline',
    repositoryDescription: 'An ML pipeline project.',
    readme: '# ML Pipeline\nMachine learning pipeline for data processing.',
    portfolioDescription: 'ML pipeline for data processing.',
  });
  const result = validateDocsPack(raw, input);
  assertEqual(result, null, 'Pack for wrong project should be rejected');
});

// ── Test 15: Fake user achievement → rejected ───────────────

test('Fake user achievement → rejected', () => {
  const input = makeInput();
  const raw = makeValidRawPack({
    readme: 'You already have demonstrated exceptional backend development skills. You have proven your expertise in REST APIs.',
    portfolioDescription: 'You are an expert in backend development.',
  });
  const result = validateDocsPack(raw, input);
  assertEqual(result, null, 'Fake achievements should be rejected');
});

// ── Test 16: Fake existing evidence → rejected ──────────────

test('Fake existing evidence → rejected', () => {
  const input = makeInput();
  const raw = makeValidRawPack({
    readme: 'Your existing evidence shows strong backend skills. You already demonstrated REST API development.',
    portfolioDescription: 'Current evidence proves your backend capabilities.',
  });
  const result = validateDocsPack(raw, input);
  assertEqual(result, null, 'Fake existing evidence should be rejected');
});

// ── Test 17: Regeneration preserves project relationship ────

test('Regeneration preserves project relationship', () => {
  const input = makeInput();

  const first = makeValidRawPack({
    repositoryName: 'production-rest-api',
    readme: '# Production REST API\nFirst version of README.',
  });

  const second = makeValidRawPack({
    repositoryName: 'prod-rest-api-auth',
    readme: '# Production REST API with Auth\nDifferent README structure.',
  });

  const result1 = validateDocsPack(first, input);
  const result2 = validateDocsPack(second, input);

  assert(result1 !== null, 'First pack valid');
  assert(result2 !== null, 'Second pack valid');
  assertEqual(result1!.projectTitle, result2!.projectTitle, 'Same project title on regeneration');
});

// ── Bonus: buildDocsInput edge cases ────────────────────────

test('No blueprint → buildDocsInput returns null', () => {
  const result = buildDocsInput(null, null, ['Node.js']);
  assertEqual(result, null, 'No blueprint → null');
});

test('Blueprint with empty title → buildDocsInput returns null', () => {
  const result = buildDocsInput(
    { projectTitle: '', relatedGap: 'rest apis', objective: 'o', requirements: [], features: [], architecture: 'a', databaseSchema: { entities: [], relationships: [] }, technologies: [], expectedEvidence: [], developmentTasks: [] } as any,
    null,
    ['Node.js'],
  );
  assertEqual(result, null, 'Empty title → null');
});

// ── Bonus: parseDocsPackResponse ────────────────────────────

test('parseDocsPackResponse handles edge cases', () => {
  assertEqual(parseDocsPackResponse(''), null, 'Empty string → null');
  assertEqual(parseDocsPackResponse('not json'), null, 'Non-JSON → null');
  assertEqual(parseDocsPackResponse('{broken'), null, 'Broken JSON → null');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
