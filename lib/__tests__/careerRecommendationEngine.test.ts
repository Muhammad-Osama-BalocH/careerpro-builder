/**
 * Test cases for lib/careerRecommendationEngine.ts
 *
 * Run: npx tsx lib/__tests__/careerRecommendationEngine.test.ts
 */

import type {
  DerivedSkillIntelligence,
  CareerGapAnalysis,
  StructuredRecommendationsInput,
  StructuredCareerRecommendation,
} from '@/types/career';
import {
  buildRecommendationInput,
  validateRecommendations,
  parseGeminiResponse,
} from '@/lib/careerRecommendationEngine';

// ── Helpers ──────────────────────────────────────────────────

function makeSkillIntel(
  name: string,
  strengthLevel: DerivedSkillIntelligence['strengthLevel'],
  evidenceCount: number,
): DerivedSkillIntelligence {
  return {
    name,
    category: 'technical',
    strengthLevel,
    confidence: strengthLevel === 'advanced' ? 90 : strengthLevel === 'strong' ? 70 : strengthLevel === 'developing' ? 40 : 10,
    evidenceCount,
    evidenceIds: Array.from({ length: evidenceCount }, (_, i) => `ev-${name}-${i}`),
    sourceTypes: evidenceCount > 0 ? ['project'] : [],
    explicitlyListed: true,
  };
}

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

function makeValidRawRec(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    type: 'build_project',
    title: 'Build a Production REST API',
    description: 'Create a backend API project to demonstrate server-side skills.',
    relatedSkill: 'rest apis',
    relatedGap: 'rest apis',
    reason: 'Your profile shows strong frontend skills but limited backend evidence.',
    priority: 'high',
    recommendedAction: 'Build a REST API with authentication and database integration',
    expectedOutcome: 'Backend project demonstrating API design, auth, and database skills',
    skillsToDevelop: ['Node.js', 'REST APIs', 'Authentication', 'Database'],
    evidenceToCreate: ['Backend project', 'API endpoints', 'Authentication implementation'],
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

// ── Test 1: High-priority gap → relevant recommendation ──────

test('High-priority gap produces valid high-priority recommendation', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react', 'javascript'],
    skillsWithStrength: [
      { skill: 'React', strength: 'strong', confidence: 70 },
      { skill: 'JavaScript', strength: 'strong', confidence: 75 },
    ],
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence for REST APIs' },
    ],
    projectCount: 3,
    experienceCount: 1,
  };

  const rawRecs = [makeValidRawRec()];
  const results = validateRecommendations(rawRecs, input);

  assertEqual(results.length, 1, 'Should produce 1 recommendation');
  assertEqual(results[0].priority, 'high', 'Recommendation priority should be high');
  assertEqual(results[0].relatedGap, 'rest apis', 'Should reference the gap');
  assert(results[0].skillsToDevelop.length > 0, 'Should list skills to develop');
  assert(results[0].evidenceToCreate.length > 0, 'Should list evidence to create');
});

// ── Test 2: Medium-priority gap → relevant recommendation ────

test('Medium-priority gap produces valid recommendation', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'frontend developer',
    demonstratedSkills: ['react', 'javascript', 'html', 'css'],
    skillsWithStrength: [
      { skill: 'React', strength: 'strong', confidence: 70 },
    ],
    careerGaps: [
      { skill: 'testing', status: 'missing', priority: 'medium', missingEvidence: 'No evidence for testing' },
    ],
    projectCount: 2,
    experienceCount: 0,
  };

  const rawRecs = [makeValidRawRec({
    type: 'learning_task',
    title: 'Add Testing to Your Projects',
    relatedSkill: 'testing',
    relatedGap: 'testing',
    priority: 'medium',
    reason: 'Testing is a helpful skill for frontend developers.',
    recommendedAction: 'Add unit tests to an existing project',
    expectedOutcome: 'Testing evidence in project',
    skillsToDevelop: ['Testing', 'Jest'],
    evidenceToCreate: ['Test files'],
  })];

  const results = validateRecommendations(rawRecs, input);
  assertEqual(results.length, 1, 'Should produce 1 recommendation');
  assertEqual(results[0].priority, 'medium', 'Recommendation priority should be medium');
});

// ── Test 3: Multiple gaps → recommendations sorted by priority ─

test('Multiple gaps → recommendations prioritize correctly', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No backend evidence' },
      { skill: 'authentication', status: 'missing', priority: 'high', missingEvidence: 'No auth evidence' },
      { skill: 'deployment', status: 'missing', priority: 'medium', missingEvidence: 'No deployment evidence' },
      { skill: 'testing', status: 'missing', priority: 'medium', missingEvidence: 'No testing evidence' },
    ],
    projectCount: 1,
    experienceCount: 0,
  };

  const rawRecs = [
    makeValidRawRec({ priority: 'medium', relatedSkill: 'testing', relatedGap: 'testing' }),
    makeValidRawRec({ priority: 'high', relatedSkill: 'rest apis', relatedGap: 'rest apis' }),
    makeValidRawRec({ priority: 'high', relatedSkill: 'authentication', relatedGap: 'authentication' }),
    makeValidRawRec({ priority: 'medium', relatedSkill: 'deployment', relatedGap: 'deployment' }),
  ];

  const results = validateRecommendations(rawRecs, input);
  assertEqual(results.length, 4, 'Should produce 4 recommendations');
  // High-priority recommendations should come first
  assertEqual(results[0].priority, 'high', 'First recommendation should be high priority');
  assertEqual(results[1].priority, 'high', 'Second recommendation should be high priority');
  assertEqual(results[2].priority, 'medium', 'Third recommendation should be medium');
  assertEqual(results[3].priority, 'medium', 'Fourth should be medium');
});

// ── Test 4: No gaps → no recommendations ─────────────────────

test('No career gaps → validateRecommendations returns empty', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'frontend developer',
    demonstratedSkills: ['react', 'javascript', 'html', 'css'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [],
    projectCount: 5,
    experienceCount: 2,
  };

  const rawRecs = [makeValidRawRec()];
  // With no gaps, the grounding check should filter out the recommendation
  const results = validateRecommendations(rawRecs, input);
  assertEqual(results.length, 0, 'No gaps → no recommendations should pass grounding check');
});

// ── Test 5: No target career → buildRecommendationInput returns null ──

test('No target career → buildRecommendationInput returns null', () => {
  const gapAnalysis: CareerGapAnalysis = {
    targetRole: '',
    requiredSkills: [],
    demonstratedSkills: [],
    gaps: [],
  };

  const result = buildRecommendationInput([], gapAnalysis, 0, 0);
  assertEqual(result, null, 'No target role → null input');
});

// ── Test 6: Insufficient data → buildRecommendationInput returns null ──

test('Insufficient data → buildRecommendationInput returns null', () => {
  const gapAnalysis: CareerGapAnalysis = {
    targetRole: 'frontend developer',
    requiredSkills: [],
    demonstratedSkills: [],
    gaps: [], // no gaps and no skills
  };

  const result = buildRecommendationInput([], gapAnalysis, 0, 0);
  assertEqual(result, null, 'No gaps and no skills → null input');
});

// ── Test 7: Gemini malformed response → handled safely ───────

test('Gemini malformed response → validateRecommendations filters it out', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence' },
    ],
    projectCount: 1,
    experienceCount: 0,
  };

  // Missing required fields
  const badRecs = [
    {}, // empty object
    { type: 'invalid_type', title: 'Test', description: 'd', reason: 'r', priority: 'high', recommendedAction: 'a' },
    { type: 'build_project', title: '', description: 'd', reason: 'r', priority: 'high', recommendedAction: 'a' }, // empty title
    { type: 'build_project', title: 'T', description: 'd', reason: 'r', priority: 'invalid', recommendedAction: 'a' }, // bad priority
    { type: 'build_project', title: 'T', description: '', reason: 'r', priority: 'high', recommendedAction: 'a' }, // empty description
    'not an object', // string instead of object
  ];

  const results = validateRecommendations(badRecs, input);
  assertEqual(results.length, 0, 'All malformed recommendations should be filtered out');
});

// ── Test 8: Gemini failure → user-friendly error (parseGeminiResponse) ──

test('Gemini failure/invalid text → parseGeminiResponse returns empty array', () => {
  assertEqual(parseGeminiResponse('').length, 0, 'Empty string → empty array');
  assertEqual(parseGeminiResponse('not json at all').length, 0, 'Non-JSON text → empty array');
  assertEqual(parseGeminiResponse('{ "not": "an array" }').length, 0, 'JSON object (not array) → empty array');
  assertEqual(parseGeminiResponse('undefined').length, 0, 'undefined string → empty array');
});

// ── Test 9: AI cannot modify deterministic scores ─────────────

test('AI recommendation output does not affect deterministic skill/gap scores', () => {
  // Simulate that validateRecommendations only produces StructuredCareerRecommendation
  // objects with suggestion fields — no score modification possible
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence' },
    ],
    projectCount: 1,
    experienceCount: 0,
  };

  const results = validateRecommendations([makeValidRawRec()], input);

  // Verify the recommendation type does not contain scoring fields
  for (const rec of results) {
    const recKeys = Object.keys(rec);
    assert(!recKeys.includes('confidence'), 'Recommendation must not contain confidence field');
    assert(!recKeys.includes('evidenceCount'), 'Recommendation must not contain evidenceCount field');
    assert(!recKeys.includes('strengthLevel'), 'Recommendation must not contain strengthLevel field');
    assert(!recKeys.includes('currentEvidenceLevel'), 'Recommendation must not contain currentEvidenceLevel field');
  }
});

// ── Test 10: Recommendation is grounded in supplied career data ──

test('Recommendations not referencing a known gap are filtered out (grounding check)', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'frontend developer',
    demonstratedSkills: ['react', 'javascript'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [
      { skill: 'html', status: 'missing', priority: 'high', missingEvidence: 'No HTML evidence' },
    ],
    projectCount: 1,
    experienceCount: 0,
  };

  // Recommendation about Photoshop (unrelated to gaps)
  const ungroundedRec = makeValidRawRec({
    type: 'learning_task',
    title: 'Learn Photoshop',
    description: 'Design skills are useful.',
    relatedSkill: 'photoshop',
    relatedGap: 'photoshop',
    reason: 'Photoshop is a popular tool.',
    priority: 'low',
    recommendedAction: 'Take a Photoshop course',
    expectedOutcome: 'Design skill improvement',
    skillsToDevelop: ['Photoshop'],
    evidenceToCreate: ['Design portfolio'],
  });

  const results = validateRecommendations([ungroundedRec], input);
  assertEqual(results.length, 0, 'Ungrounded recommendation should be filtered out');
});

// ── Test 11: parseGeminiResponse handles markdown code fences ──

test('parseGeminiResponse handles markdown code fences', () => {
  const withFences = '```json\n[{"type":"build_project","title":"Test"}]\n```';
  const parsed = parseGeminiResponse(withFences);
  assertEqual(parsed.length, 1, 'Should parse JSON inside code fences');
  assertEqual((parsed[0] as Record<string, unknown>).title, 'Test', 'Should extract title');
});

// ── Test 12: validateRecommendations limits to 5 recommendations ──

test('validateRecommendations limits to 5 recommendations', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: Array.from({ length: 8 }, (_, i) => ({
      skill: `gap-${i}`,
      status: 'missing',
      priority: i < 3 ? 'high' : 'medium',
      missingEvidence: `No evidence for gap-${i}`,
    })),
    projectCount: 1,
    experienceCount: 0,
  };

  const rawRecs = Array.from({ length: 8 }, (_, i) => makeValidRawRec({
    relatedSkill: `gap-${i}`,
    relatedGap: `gap-${i}`,
    title: `Recommendation ${i}`,
  }));

  const results = validateRecommendations(rawRecs, input);
  assert(results.length <= 5, `Should limit to 5 recommendations, got ${results.length}`);
});

// ── Test 13: buildRecommendationInput builds correct structure ──

test('buildRecommendationInput builds correct structured input', () => {
  const skillIntel = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('TypeScript', 'developing', 2),
  ];
  const gapAnalysis = makeGapAnalysis('frontend developer', ['react'], [
    { skill: 'html', status: 'missing', priority: 'high', missingEvidence: 'No HTML evidence' },
  ]);

  const result = buildRecommendationInput(skillIntel, gapAnalysis, 3, 1);

  assert(result != null, 'Input should not be null');
  assertEqual(result!.targetRole, 'frontend developer', 'Target role');
  assert(result!.demonstratedSkills.includes('react'), 'Demonstrated skills should include react');
  assertEqual(result!.skillsWithStrength.length, 2, 'Should include 2 skills with strength');
  assertEqual(result!.careerGaps.length, 1, 'Should include 1 career gap');
  assertEqual(result!.projectCount, 3, 'Project count');
  assertEqual(result!.experienceCount, 1, 'Experience count');
});

// ── Test 14: Recommendation with missing arrays defaults safely ──

test('Recommendation with missing skillsToDevelop/evidenceToCreate defaults to empty arrays', () => {
  const input: StructuredRecommendationsInput = {
    targetRole: 'full-stack developer',
    demonstratedSkills: ['react'],
    skillsWithStrength: [{ skill: 'React', strength: 'strong', confidence: 70 }],
    careerGaps: [
      { skill: 'rest apis', status: 'missing', priority: 'high', missingEvidence: 'No evidence' },
    ],
    projectCount: 1,
    experienceCount: 0,
  };

  const rawRec = makeValidRawRec();
  delete rawRec.skillsToDevelop;
  delete rawRec.evidenceToCreate;

  const results = validateRecommendations([rawRec], input);
  assertEqual(results.length, 1, 'Should produce 1 recommendation');
  assertEqual(results[0].skillsToDevelop.length, 0, 'skillsToDevelop should default to empty');
  assertEqual(results[0].evidenceToCreate.length, 0, 'evidenceToCreate should default to empty');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
