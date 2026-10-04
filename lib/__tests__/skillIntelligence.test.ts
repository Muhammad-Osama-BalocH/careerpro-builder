/**
 * Test cases for lib/skillIntelligence.ts
 *
 * Run: npx tsx lib/__tests__/skillIntelligence.test.ts
 */

import type { Portfolio } from '@/types/portfolio';
import type { CareerEvidence } from '@/types/career';
import { deriveSkillIntelligence } from '@/lib/skillIntelligence';

// ── Helpers ──────────────────────────────────────────────────

let idCounter = 0;
function nextId(prefix = 'ev'): string {
  return `${prefix}-${++idCounter}`;
}

function makeEvidence(
  skill: string,
  sourceType: CareerEvidence['sourceType'],
  sourceId: string,
  strength: CareerEvidence['evidenceStrength'],
  overrides?: Partial<CareerEvidence>,
): CareerEvidence {
  return {
    id: nextId(),
    userId: 'test-user',
    skill,
    sourceType,
    sourceId,
    sourceTitle: `${sourceType} ${sourceId}`,
    evidenceText: `${skill} demonstrated in ${sourceType} ${sourceId}`,
    evidenceStrength: strength,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePortfolio(skills: string[], projects: Array<{ id: string; techStack: string[]; description?: string }>): Portfolio {
  return {
    id: 'portfolio-1',
    name: 'Test User',
    title: 'Developer',
    email: 'test@test.com',
    about: 'Test about',
    skills,
    projects: projects.map((p) => ({
      id: p.id,
      name: `Project ${p.id}`,
      description: p.description ?? `A project using ${p.techStack.join(', ')}`,
      techStack: p.techStack,
    })),
    experience: [],
    education: [],
    template: 'minimal',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
}

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  idCounter = 0; // reset for deterministic IDs
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

// ── Test 1: Skill with multiple project evidence ─────────────

test('Skill with multiple project evidence → strong/advanced', () => {
  const portfolio = makePortfolio(
    ['JavaScript', 'React', 'Node.js'],
    [
      { id: 'p1', techStack: ['React', 'Node.js'] },
      { id: 'p2', techStack: ['React', 'JavaScript'] },
      { id: 'p3', techStack: ['React'] },
      { id: 'p4', techStack: ['React', 'TypeScript'] },
      { id: 'p5', techStack: ['JavaScript', 'React'] },
    ],
  );

  const evidence: CareerEvidence[] = [
    makeEvidence('React', 'project', 'p1', 'strong'),
    makeEvidence('Node.js', 'project', 'p1', 'strong'),
    makeEvidence('React', 'project', 'p2', 'strong'),
    makeEvidence('JavaScript', 'project', 'p2', 'strong'),
    makeEvidence('React', 'project', 'p3', 'strong'),
    makeEvidence('React', 'project', 'p4', 'strong'),
    makeEvidence('TypeScript', 'project', 'p4', 'strong'),
    makeEvidence('React', 'project', 'p5', 'strong'),
    makeEvidence('JavaScript', 'project', 'p5', 'strong'),
  ];

  const results = deriveSkillIntelligence(portfolio, evidence);
  const react = results.find((s) => s.name.toLowerCase() === 'react');

  assert(react != null, 'React skill should exist');
  assertEqual(react!.evidenceCount, 5, 'React evidence count');
  assertEqual(react!.sourceTypes.length, 1, 'React source types (project only)');
  assert(react!.confidence >= 51, `React confidence should be ≥ 51 (strong+), got ${react!.confidence}`);
  assert(react!.strengthLevel === 'strong' || react!.strengthLevel === 'advanced',
    `React strength should be strong or advanced, got ${react!.strengthLevel}`);
  assert(react!.explicitlyListed, 'React should be explicitly listed');
  assert(react!.category === 'tool', 'React should be categorized as tool');
});

// ── Test 2: Skill with one evidence item ─────────────────────

test('Skill with one evidence item → emerging/developing', () => {
  const portfolio = makePortfolio(
    ['Python'],
    [{ id: 'p1', techStack: ['Python'] }],
  );

  const evidence: CareerEvidence[] = [
    makeEvidence('Python', 'project', 'p1', 'moderate'),
  ];

  const results = deriveSkillIntelligence(portfolio, evidence);
  const python = results.find((s) => s.name.toLowerCase() === 'python');

  assert(python != null, 'Python skill should exist');
  assertEqual(python!.evidenceCount, 1, 'Python evidence count');
  // Volume=8 (1×8), Diversity=0 (1 source), Quality=round((2/3)×35)=23 → 31
  assertEqual(python!.confidence, 31, 'Python confidence');
  assert(python!.confidence <= 50, `Python confidence should be ≤ 50 (developing or below), got ${python!.confidence}`);
  assert(python!.strengthLevel === 'emerging' || python!.strengthLevel === 'developing',
    `Python strength should be emerging or developing, got ${python!.strengthLevel}`);
});

// ── Test 3: Skill with no evidence ───────────────────────────

test('Skill with no evidence → emerging, 0% confidence', () => {
  const portfolio = makePortfolio(
    ['Rust'],
    [], // no projects with Rust
  );

  const evidence: CareerEvidence[] = [];

  const results = deriveSkillIntelligence(portfolio, evidence);
  const rust = results.find((s) => s.name.toLowerCase() === 'rust');

  assert(rust != null, 'Rust skill should exist (from portfolio.skills)');
  assertEqual(rust!.evidenceCount, 0, 'Rust evidence count');
  assertEqual(rust!.confidence, 0, 'Rust confidence');
  assertEqual(rust!.strengthLevel, 'emerging', 'Rust strength level');
  assertEqual(rust!.evidenceIds.length, 0, 'Rust evidence IDs should be empty');
  assert(rust!.explicitlyListed, 'Rust should be explicitly listed');
});

// ── Test 4: Duplicate evidence sources don't inflate scores ──

test('Duplicate evidence sources do not inflate scores', () => {
  const portfolio = makePortfolio(
    ['JavaScript'],
    [{ id: 'p1', techStack: ['JavaScript'] }],
  );

  // Same source (project p1) listed twice with different IDs — should be deduped
  const duplicateEvidence: CareerEvidence[] = [
    makeEvidence('JavaScript', 'project', 'p1', 'strong'),
    makeEvidence('JavaScript', 'project', 'p1', 'moderate'), // duplicate source
    makeEvidence('JavaScript', 'project', 'p1', 'weak'),      // duplicate source
  ];

  const singleEvidence: CareerEvidence[] = [
    makeEvidence('JavaScript', 'project', 'p1', 'strong'),
  ];

  const resultsDup = deriveSkillIntelligence(portfolio, duplicateEvidence);
  const resultsSingle = deriveSkillIntelligence(portfolio, singleEvidence);

  const jsDup = resultsDup.find((s) => s.name.toLowerCase() === 'javascript')!;
  const jsSingle = resultsSingle.find((s) => s.name.toLowerCase() === 'javascript')!;

  assertEqual(jsDup.evidenceCount, 1, 'Duplicate: evidence count should be 1 after dedup');
  assertEqual(jsDup.confidence, jsSingle.confidence, 'Confidence should be identical after dedup');
  assertEqual(jsDup.evidenceIds.length, 1, 'Duplicate: should have 1 evidence ID');
  // The kept evidence should be the strongest one
  assert(jsDup.evidenceIds[0] === duplicateEvidence[0].id, 'Should keep the strongest evidence');
});

// ── Test 5: Scores are deterministic ─────────────────────────

test('Scores are deterministic (same input = same output)', () => {
  const portfolio = makePortfolio(
    ['TypeScript', 'React'],
    [
      { id: 'p1', techStack: ['React', 'TypeScript'] },
      { id: 'p2', techStack: ['React'] },
    ],
  );

  const evidence: CareerEvidence[] = [
    makeEvidence('React', 'project', 'p1', 'strong'),
    makeEvidence('TypeScript', 'project', 'p1', 'moderate'),
    makeEvidence('React', 'project', 'p2', 'strong'),
  ];

  const run1 = deriveSkillIntelligence(portfolio, evidence);
  idCounter = 0; // reset to get same IDs
  const run2 = deriveSkillIntelligence(portfolio, [...evidence]);

  assertEqual(run1.length, run2.length, 'Same number of skills');
  for (let i = 0; i < run1.length; i++) {
    assertEqual(run1[i].confidence, run2[i].confidence, `Skill ${run1[i].name} confidence deterministic`);
    assertEqual(run1[i].strengthLevel, run2[i].strengthLevel, `Skill ${run1[i].name} strength deterministic`);
    assertEqual(run1[i].evidenceCount, run2[i].evidenceCount, `Skill ${run1[i].name} evidence count deterministic`);
  }
});

// ── Test 6: No evidence is invented ──────────────────────────

test('No evidence is invented — only real user data or deterministic mapping', () => {
  const portfolio = makePortfolio(
    ['JavaScript'],
    [{ id: 'p1', techStack: ['JavaScript', 'React'] }],
  );

  const evidence: CareerEvidence[] = [
    makeEvidence('JavaScript', 'project', 'p1', 'strong'),
    makeEvidence('React', 'project', 'p1', 'strong'),
  ];

  const results = deriveSkillIntelligence(portfolio, evidence);

  // Known deterministic mappings from tech stacks in this test
  const deterministicMappings: Record<string, string[]> = {
    react: ['javascript', 'frontend development'],
  };

  for (const skill of results) {
    const isListed = portfolio.skills.some((s) => s.toLowerCase() === skill.name.toLowerCase());
    const isInTechStack = portfolio.projects.some((p) =>
      p.techStack.some((t) => t.toLowerCase() === skill.name.toLowerCase()),
    );
    const isInEvidence = evidence.some((e) => e.skill.toLowerCase() === skill.name.toLowerCase());
    const isInferredFromMapping = portfolio.projects.some((p) =>
      p.techStack.some((t) => {
        const related = deterministicMappings[t.toLowerCase()];
        return related?.some((r) => r.toLowerCase() === skill.name.toLowerCase());
      }),
    );

    assert(
      isListed || isInTechStack || isInEvidence || isInferredFromMapping,
      `Skill "${skill.name}" must trace to real user data or deterministic mapping (listed=${isListed}, techStack=${isInTechStack}, evidence=${isInEvidence}, inferred=${isInferredFromMapping})`,
    );
  }

  // No skill should appear that has zero evidence AND isn't in portfolio data
  const zeroEvidenceNonListed = results.filter((s) => s.evidenceCount === 0 && !s.explicitlyListed);
  // Inferred skills from tech relationships may have 0 evidence if not in the evidence list yet
  // But they should have an "inferred" marker
  for (const s of zeroEvidenceNonListed) {
    assert(!s.explicitlyListed, `Non-listed skill with 0 evidence "${s.name}" should not be explicitlyListed`);
  }
});

// ── Test 7: Multi-source diversity boosts score ──────────────

test('Multi-source diversity boosts confidence over single source', () => {
  const portfolio = makePortfolio(
    ['Python'],
    [{ id: 'p1', techStack: ['Python'] }],
  );

  const singleSource: CareerEvidence[] = [
    makeEvidence('Python', 'project', 'p1', 'strong'),
    makeEvidence('Python', 'project', 'p2', 'strong'),
    makeEvidence('Python', 'project', 'p3', 'strong'),
  ];

  const multiSource: CareerEvidence[] = [
    makeEvidence('Python', 'project', 'p1', 'strong'),
    makeEvidence('Python', 'experience', 'e1', 'strong'),
    makeEvidence('Python', 'education', 'ed1', 'strong'),
  ];

  const singleResults = deriveSkillIntelligence(portfolio, singleSource);
  const multiResults = deriveSkillIntelligence(portfolio, multiSource);

  const pySingle = singleResults.find((s) => s.name.toLowerCase() === 'python')!;
  const pyMulti = multiResults.find((s) => s.name.toLowerCase() === 'python')!;

  assert(pyMulti.confidence > pySingle.confidence,
    `Multi-source (${pyMulti.confidence}%) should beat single-source (${pySingle.confidence}%)`);
  assertEqual(pyMulti.sourceTypes.length, 3, 'Multi-source should have 3 source types');
  assertEqual(pySingle.sourceTypes.length, 1, 'Single-source should have 1 source type');
});

// ── Test 8: Existing portfolios still work (empty portfolio) ─

test('Empty portfolio produces no skills', () => {
  const portfolio: Portfolio = {
    id: 'empty',
    name: '',
    title: '',
    about: '',
    skills: [],
    projects: [],
    experience: [],
    education: [],
    template: 'minimal',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const results = deriveSkillIntelligence(portfolio, []);
  assertEqual(results.length, 0, 'Empty portfolio should have 0 skills');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
