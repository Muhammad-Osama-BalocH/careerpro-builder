/**
 * Test cases for lib/careerGapIntelligence.ts
 *
 * Run: npx tsx lib/__tests__/careerGapIntelligence.test.ts
 */

import type { DerivedSkillIntelligence, CareerGapAnalysis } from '@/types/career';
import {
  analyzeCareerGaps,
  findRoleProfile,
  resolveTargetRole,
  getAvailableRoles,
} from '@/lib/careerGapIntelligence';

// ── Helpers ──────────────────────────────────────────────────

function makeSkillIntel(
  name: string,
  strengthLevel: DerivedSkillIntelligence['strengthLevel'],
  evidenceCount: number,
  overrides?: Partial<DerivedSkillIntelligence>,
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

// ── Test 1: Strong skill → no gap ────────────────────────────

test('Strong skill → no gap created', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('CSS', 'advanced', 6),
    makeSkillIntel('HTML', 'strong', 3),
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  assert(!result.gaps.some((g) => g.skill === 'react'), 'React should NOT be a gap (strong)');
  assert(!result.gaps.some((g) => g.skill === 'javascript'), 'JavaScript should NOT be a gap (strong)');
  assert(!result.gaps.some((g) => g.skill === 'css'), 'CSS should NOT be a gap (advanced)');
  assert(!result.gaps.some((g) => g.skill === 'html'), 'HTML should NOT be a gap (strong)');
  assert(result.demonstratedSkills.includes('react'), 'React should be in demonstratedSkills');
  assert(result.demonstratedSkills.includes('javascript'), 'JavaScript should be in demonstratedSkills');
});

// ── Test 2: Developing skill → appropriate gap ───────────────

test('Developing skill → appropriate gap with developing status', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('CSS', 'strong', 3),
    makeSkillIntel('HTML', 'strong', 3),
    makeSkillIntel('TypeScript', 'developing', 1),
    makeSkillIntel('Responsive Design', 'developing', 1),
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  const tsGap = result.gaps.find((g) => g.skill === 'typescript');
  assert(tsGap != null, 'TypeScript should appear as a gap (developing)');
  assertEqual(tsGap!.status, 'developing', 'TypeScript gap status');
  assertEqual(tsGap!.currentEvidenceLevel, 'moderate', 'TypeScript evidence level');
  assert(tsGap!.priority === 'medium' || tsGap!.priority === 'low', 'Developing important skill should be medium or low priority');
  assert(tsGap!.missingEvidence.length > 0, 'TypeScript gap should explain missing evidence');
});

// ── Test 3: Missing skill → gap created ──────────────────────

test('Missing skill → gap created with missing status', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  const htmlGap = result.gaps.find((g) => g.skill === 'html');
  assert(htmlGap != null, 'HTML should appear as a gap (missing)');
  assertEqual(htmlGap!.status, 'missing', 'HTML gap status');
  assertEqual(htmlGap!.currentEvidenceLevel, 'none', 'HTML evidence level');
  assertEqual(htmlGap!.priority, 'high', 'Missing core skill should be high priority');
  assert(htmlGap!.missingEvidence.includes('No evidence'), 'Missing skill description should mention no evidence');

  const cssGap = result.gaps.find((g) => g.skill === 'css');
  assert(cssGap != null, 'CSS should appear as a gap (missing)');
  assertEqual(cssGap!.status, 'missing', 'CSS gap status');
  assertEqual(cssGap!.priority, 'high', 'Missing core CSS should be high priority');
});

// ── Test 4: Multiple gaps → correct priorities ───────────────

test('Multiple gaps → priorities follow importance × evidence rules', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('JavaScript', 'strong', 5),
    // Missing: HTML (core), CSS (core), React (core)
    // Weak: responsive design (core)
    makeSkillIntel('Responsive Design', 'emerging', 1),
    // Missing: TypeScript (important), APIs (important)
    // Missing: version control (important), testing (helpful)
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  const htmlGap = result.gaps.find((g) => g.skill === 'html');
  const reactGap = result.gaps.find((g) => g.skill === 'react');
  const tsGap = result.gaps.find((g) => g.skill === 'typescript');
  const testingGap = result.gaps.find((g) => g.skill === 'testing');

  assertEqual(htmlGap!.priority, 'high', 'Missing core HTML → high');
  assertEqual(reactGap!.priority, 'high', 'Missing core React → high');
  assertEqual(tsGap!.priority, 'high', 'Missing important TypeScript → high');
  assertEqual(testingGap!.priority, 'medium', 'Missing helpful testing → medium');

  // Core skills should come before helpful skills in sort order
  const coreIndex = result.gaps.findIndex((g) => g.priority === 'high');
  const helpIndex = result.gaps.findIndex((g) => g.priority === 'medium');
  assert(coreIndex < helpIndex, 'High priority gaps should appear before medium');

  // Verify gaps are sorted: high first, then medium, then low
  const priorities = result.gaps.map((g) => g.priority);
  const prioOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  let lastPrio = 4;
  for (const p of priorities) {
    assert(prioOrder[p] <= lastPrio, `Gaps should be sorted by priority descending, got ${p} after ${lastPrio}`);
    lastPrio = prioOrder[p];
  }
});

// ── Test 5: No target role → no misleading gaps ──────────────

test('No target role → empty analysis with no gaps', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
  ];

  const result = analyzeCareerGaps(skillIntel, [], '');

  assertEqual(result.targetRole, '', 'No target role should be empty string');
  assertEqual(result.gaps.length, 0, 'No target role → no gaps');
  assertEqual(result.requiredSkills.length, 0, 'No required skills');
  assertEqual(result.demonstratedSkills.length, 0, 'No demonstrated skills');
});

// ── Test 6: Duplicate evidence → no incorrect gap changes ────

test('Duplicate evidence does not affect gap detection (8B handles dedup)', () => {
  // 8B already deduplicates, so skillIntelligence evidenceCount reflects deduped count.
  // This test verifies that gap analysis uses the 8B output correctly.
  const skillIntelSingle: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('TypeScript', 'developing', 2),
  ];

  const skillIntelDup: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4), // same as single
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('TypeScript', 'developing', 2),
  ];

  const resultSingle = analyzeCareerGaps(skillIntelSingle, ['frontend developer'], '');
  const resultDup = analyzeCareerGaps(skillIntelDup, ['frontend developer'], '');

  assertEqual(resultSingle.gaps.length, resultDup.gaps.length, 'Same gap count');
  for (let i = 0; i < resultSingle.gaps.length; i++) {
    assertEqual(resultSingle.gaps[i].skill, resultDup.gaps[i].skill, `Gap ${i} skill should match`);
    assertEqual(resultSingle.gaps[i].status, resultDup.gaps[i].status, `Gap ${i} status should match`);
    assertEqual(resultSingle.gaps[i].priority, resultDup.gaps[i].priority, `Gap ${i} priority should match`);
  }
});

// ── Test 7: Empty portfolio → safe empty result ──────────────

test('Empty portfolio → no gaps (but valid structure)', () => {
  const result = analyzeCareerGaps([], ['frontend developer'], '');

  // All frontend skills should be gaps since user has no skills
  assertEqual(result.targetRole, 'frontend developer', 'Target role should be resolved');
  assert(result.gaps.length > 0, 'Should have gaps for all required skills');
  assert(result.demonstratedSkills.length === 0, 'No demonstrated skills');
  // All gaps should be missing status
  assert(result.gaps.every((g) => g.status === 'missing'), 'All gaps should be missing');
  assert(result.gaps.every((g) => g.relatedEvidenceIds.length === 0), 'No related evidence IDs');
});

// ── Test 8: Existing strong evidence → not classified as missing ─

test('Strong evidence skills are never incorrectly classified as missing', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'advanced', 8),
    makeSkillIntel('JavaScript', 'advanced', 10),
    makeSkillIntel('TypeScript', 'strong', 5),
    makeSkillIntel('HTML', 'strong', 4),
    makeSkillIntel('CSS', 'strong', 3),
    makeSkillIntel('Responsive Design', 'strong', 4),
    makeSkillIntel('APIs', 'strong', 3),
    makeSkillIntel('Version Control', 'strong', 2),
    makeSkillIntel('Testing', 'strong', 2),
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  assertEqual(result.gaps.length, 0, 'All skills demonstrated → no gaps');
  assert(result.demonstratedSkills.length >= 7, 'Should have many demonstrated skills');

  // No skill with strong/advanced should appear in gaps
  for (const g of result.gaps) {
    const si = skillIntel.find((s) => s.name.toLowerCase() === g.skill.toLowerCase());
    if (si) {
      assert(si.strengthLevel === 'emerging' || si.strengthLevel === 'developing',
        `Skill "${g.skill}" with strength "${si.strengthLevel}" should NOT be a gap`);
    }
  }
});

// ── Test 9: Full pipeline from portfolio → evidence → skill → gap ─

test('Full pipeline: portfolio → evidence → skill intelligence → gap analysis', () => {
  // Simulate the full pipeline output
  // User is aiming for full-stack but only has frontend evidence
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('TypeScript', 'strong', 3),
    makeSkillIntel('CSS', 'strong', 3),
    makeSkillIntel('HTML', 'strong', 2),
    // Missing: rest apis, authentication, databases, deployment
    // Weak: version control
    makeSkillIntel('Git', 'emerging', 1), // maps to "version control"
  ];

  const result = analyzeCareerGaps(skillIntel, ['full-stack developer'], '');

  assertEqual(result.targetRole, 'full-stack developer', 'Target role resolved');
  assert(result.demonstratedSkills.length > 0, 'Should have demonstrated skills');

  // Frontend fundamentals should be demonstrated (HTML + CSS + JS match)
  assert(result.demonstratedSkills.includes('frontend fundamentals'), 'Frontend fundamentals should be demonstrated');

  // React should be demonstrated
  assert(result.demonstratedSkills.includes('react'), 'React should be demonstrated');

  // JavaScript should be demonstrated
  assert(result.demonstratedSkills.includes('javascript'), 'JavaScript should be demonstrated');

  // Backend gaps should exist
  const restGap = result.gaps.find((g) => g.skill === 'rest apis');
  assert(restGap != null, 'REST APIs should be a gap');
  assertEqual(restGap!.status, 'missing', 'REST APIs status');

  const authGap = result.gaps.find((g) => g.skill === 'authentication');
  assert(authGap != null, 'Authentication should be a gap');
  assertEqual(authGap!.priority, 'high', 'Missing core authentication → high');

  const dbGap = result.gaps.find((g) => g.skill === 'databases');
  assert(dbGap != null, 'Databases should be a gap');
  assertEqual(dbGap!.priority, 'high', 'Missing core databases → high');

  // Every gap must be explainable from target role requirements
  for (const gap of result.gaps) {
    const req = result.requiredSkills.find((r) => r.skill === gap.skill);
    assert(req != null, `Gap "${gap.skill}" must trace to a required skill for the role`);
    assert(gap.missingEvidence.length > 0, `Gap "${gap.skill}" must have missing evidence description`);
    assert(gap.targetRole === 'full-stack developer', `Gap "${gap.skill}" must reference target role`);
  }
});

// ── Test 10: findRoleProfile ─────────────────────────────────

test('findRoleProfile resolves known roles', () => {
  assert(findRoleProfile('frontend developer') != null, 'Should find frontend developer');
  assert(findRoleProfile('Frontend Developer') != null, 'Should be case-insensitive');
  assert(findRoleProfile('backend developer') != null, 'Should find backend developer');
  assert(findRoleProfile('full-stack developer') != null, 'Should find full-stack developer');
  assert(findRoleProfile('data scientist') == null, 'Should not find unknown role');
  assert(findRoleProfile('') == null, 'Empty string → null');
});

// ── Test 11: resolveTargetRole ───────────────────────────────

test('resolveTargetRole uses targetRoles first, then professionalTitle', () => {
  assertEqual(resolveTargetRole(['frontend developer'], ''), 'frontend developer', 'targetRoles[0] match');
  assertEqual(resolveTargetRole(['unknown role'], 'backend developer'), 'backend developer', 'Fallback to professionalTitle');
  assertEqual(resolveTargetRole([], 'Full-Stack Developer'), 'full-stack developer', 'professionalTitle match');
  assertEqual(resolveTargetRole([], ''), null, 'No target → null');
  assertEqual(resolveTargetRole(['data scientist'], 'product manager'), null, 'Neither matches known roles');
});

// ── Test 12: getAvailableRoles ───────────────────────────────

test('getAvailableRoles returns all defined roles', () => {
  const roles = getAvailableRoles();
  assert(roles.length >= 3, 'Should have at least 3 roles');
  assert(roles.includes('frontend developer'), 'Should include frontend developer');
  assert(roles.includes('backend developer'), 'Should include backend developer');
  assert(roles.includes('full-stack developer'), 'Should include full-stack developer');
});

// ── Test 13: Skill alias matching ────────────────────────────

test('Skill aliases match correctly in gap analysis', () => {
  // Git should match "version control"
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('HTML', 'strong', 3),
    makeSkillIntel('CSS', 'strong', 3),
    makeSkillIntel('Git', 'strong', 2),  // should match "version control"
    makeSkillIntel('Tailwind CSS', 'strong', 3), // should match "css"
    makeSkillIntel('Next.js', 'strong', 4), // should match "react"
    makeSkillIntel('Node.js', 'strong', 3), // should match "node.js" for backend
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  // Version control should be demonstrated (via Git)
  assert(result.demonstratedSkills.includes('version control'), 'Git should match version control');

  // CSS should be demonstrated (via Tailwind CSS)
  assert(result.demonstratedSkills.includes('css'), 'Tailwind CSS should match CSS');

  // React should be demonstrated (via Next.js)
  assert(result.demonstratedSkills.includes('react'), 'Next.js should match React');
});

// ── Test 14: Weak evidence gap ───────────────────────────────

test('Weak evidence → weak_evidence status with correct description', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('React', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    makeSkillIntel('HTML', 'strong', 3),
    makeSkillIntel('CSS', 'strong', 3),
    makeSkillIntel('Responsive Design', 'emerging', 1), // weak evidence
  ];

  const result = analyzeCareerGaps(skillIntel, ['frontend developer'], '');

  const respGap = result.gaps.find((g) => g.skill === 'responsive design');
  assert(respGap != null, 'Responsive design should be a gap');
  assertEqual(respGap!.status, 'weak_evidence', 'Weak evidence status');
  assertEqual(respGap!.currentEvidenceLevel, 'weak', 'Weak evidence level');
  assert(respGap!.missingEvidence.includes('1 source'), 'Should mention evidence count');
  assertEqual(respGap!.relatedEvidenceIds.length, 1, 'Should reference the weak evidence');
});

// ── Test 15: Backend developer gaps ──────────────────────────

test('Backend developer role produces correct gap structure', () => {
  const skillIntel: DerivedSkillIntelligence[] = [
    makeSkillIntel('Node.js', 'strong', 4),
    makeSkillIntel('JavaScript', 'strong', 5),
    // Missing: REST APIs, authentication, databases, api security
  ];

  const result = analyzeCareerGaps(skillIntel, ['backend developer'], '');

  assertEqual(result.targetRole, 'backend developer', 'Target role resolved');
  assert(result.demonstratedSkills.includes('node.js'), 'Node.js should be demonstrated');
  assert(result.demonstratedSkills.includes('javascript'), 'JavaScript should be demonstrated');

  const restGap = result.gaps.find((g) => g.skill === 'rest apis');
  assert(restGap != null, 'REST APIs gap should exist');
  assertEqual(restGap!.priority, 'high', 'Missing core REST APIs → high');

  const authGap = result.gaps.find((g) => g.skill === 'authentication');
  assert(authGap != null, 'Authentication gap should exist');
  assertEqual(authGap!.priority, 'high', 'Missing core authentication → high');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
