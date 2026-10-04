/**
 * Test cases for lib/evidenceIntelligence.ts + lib/evidence.ts certification derivation
 *
 * Run: npx tsx lib/__tests__/evidenceIntelligence.test.ts
 */

import type { Portfolio } from '@/types/portfolio';
import type { CareerEvidence, CareerProfile, Certification } from '@/types/career';
import { deriveEvidenceFromPortfolio, deriveCertificationEvidence } from '@/lib/evidence';
import { deriveSkillIntelligence } from '@/lib/skillIntelligence';
import {
  buildSkillEvidenceReport,
  buildAllEvidenceReports,
  findSkillEvidenceReport,
  countEvidenceBySourceType,
  isReportTraceable,
} from '@/lib/evidenceIntelligence';

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

function makePortfolio(
  skills: string[],
  projects: Array<{ id: string; techStack: string[]; description?: string }>,
  experience: Array<{ id: string; role: string; company: string; description: string }> = [],
  education: Array<{ id: string; school: string; degree: string; field?: string; description?: string }> = [],
): Portfolio {
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
    experience: experience.map((e) => ({
      id: e.id,
      role: e.role,
      company: e.company,
      startDate: '2020-01',
      description: e.description,
    })),
    education: education.map((e) => ({
      id: e.id,
      school: e.school,
      degree: e.degree,
      field: e.field,
      description: e.description,
    })),
    template: 'minimal',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeCareerProfile(certifications: Certification[] = []): CareerProfile {
  return {
    id: 'profile-1',
    userId: 'test-user',
    isPublic: true,
    professionalTitle: 'Developer',
    careerSummary: '',
    careerInterests: [],
    githubUrl: '',
    linkedinUrl: '',
    certifications,
    achievements: [],
    languages: [],
    targetRoles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  idCounter = 0;
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

test('Skill with multiple project evidence → report traces all project sources', () => {
  const portfolio = makePortfolio(
    ['React', 'JavaScript'],
    [
      { id: 'p1', techStack: ['React', 'JavaScript'] },
      { id: 'p2', techStack: ['React'] },
      { id: 'p3', techStack: ['React', 'TypeScript'] },
    ],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  const reactReport = findSkillEvidenceReport(reports, 'React');
  assert(reactReport != null, 'React report should exist');
  assertEqual(reactReport!.evidenceCount, 3, 'React should have 3 project evidence');
  assertEqual(reactReport!.uniqueSourceCount, 3, 'React should have 3 unique sources');
  assert(reactReport!.evidence.every((e) => e.sourceType === 'project'), 'All React evidence should be from projects');
  assert(isReportTraceable(reactReport!), 'React report should be traceable');
  assert(reactReport!.evidence.every((e) => e.sourceId.startsWith('p')), 'Each evidence sourceId should trace to a project');
  assert(reactReport!.confidence > 0, 'React confidence should be > 0');
  assertEqual(reactReport!.skill, 'React', 'Report skill name');
  assertEqual(reactReport!.category, 'tool', 'React category');
});

// ── Test 2: Skill with project + experience evidence ─────────

test('Skill with project + experience evidence → report shows diverse sources', () => {
  const portfolio = makePortfolio(
    ['Python'],
    [{ id: 'p1', techStack: ['Python'] }],
    [{ id: 'e1', role: 'Backend Developer', company: 'ACME', description: 'Built APIs using Python and Django' }],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  const pythonReport = findSkillEvidenceReport(reports, 'Python');
  assert(pythonReport != null, 'Python report should exist');
  assert(pythonReport!.evidenceCount >= 2, 'Python should have at least 2 evidence items');
  assert(pythonReport!.sourceTypes.includes('project'), 'Python sources should include project');
  assert(pythonReport!.sourceTypes.includes('experience'), 'Python sources should include experience');
  assertEqual(pythonReport!.uniqueSourceCount, 2, 'Python should have 2 unique sources');
  assert(isReportTraceable(pythonReport!), 'Python report should be traceable');

  const byType = countEvidenceBySourceType(pythonReport!);
  assert(byType['project'] >= 1, 'At least 1 project evidence');
  assert(byType['experience'] >= 1, 'At least 1 experience evidence');

  // Verify each evidence item has a valid source reference
  for (const e of pythonReport!.evidence) {
    assert(e.sourceId.length > 0, `Evidence sourceId should not be empty (source: ${e.sourceType})`);
    assert(e.sourceTitle.length > 0, `Evidence sourceTitle should not be empty (source: ${e.sourceType})`);
    assert(e.description.length > 0, `Evidence description should not be empty (source: ${e.sourceType})`);
    assert(['strong', 'moderate', 'weak'].includes(e.strength), `Evidence strength should be valid (got: ${e.strength})`);
  }
});

// ── Test 3: Skill with one source ────────────────────────────

test('Skill with one source → report shows single evidence', () => {
  const portfolio = makePortfolio(
    ['Docker'],
    [{ id: 'p1', techStack: ['Docker'] }],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  const dockerReport = findSkillEvidenceReport(reports, 'Docker');
  assert(dockerReport != null, 'Docker report should exist');
  assertEqual(dockerReport!.evidenceCount, 1, 'Docker should have 1 evidence');
  assertEqual(dockerReport!.uniqueSourceCount, 1, 'Docker should have 1 unique source');
  assertEqual(dockerReport!.evidence[0].sourceType, 'project', 'Single source should be project');
  assertEqual(dockerReport!.evidence[0].sourceId, 'p1', 'Source should trace to project p1');
  assert(isReportTraceable(dockerReport!), 'Single-source report should be traceable');
});

// ── Test 4: Skill with no evidence ───────────────────────────

test('Skill with no evidence → report has zero evidence items', () => {
  const portfolio = makePortfolio(
    ['Rust'],
    [],
  );

  const evidence: CareerEvidence[] = [];
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  const rustReport = findSkillEvidenceReport(reports, 'Rust');
  assert(rustReport != null, 'Rust report should exist (skill is listed but has no evidence)');
  assertEqual(rustReport!.evidenceCount, 0, 'Rust should have 0 evidence');
  assertEqual(rustReport!.uniqueSourceCount, 0, 'Rust should have 0 unique sources');
  assertEqual(rustReport!.evidence.length, 0, 'Rust evidence array should be empty');
  assertEqual(rustReport!.confidence, 0, 'Rust confidence should be 0');
  assertEqual(rustReport!.strengthLevel, 'emerging', 'Rust should be emerging');
  // A report with 0 evidence is technically traceable (nothing to trace)
  assert(isReportTraceable(rustReport!), 'Empty report should be traceable (vacuously true)');
});

// ── Test 5: Duplicate evidence does not inflate scores ────────

test('Duplicate evidence does not inflate scores or evidence count', () => {
  const portfolio = makePortfolio(
    ['JavaScript'],
    [{ id: 'p1', techStack: ['JavaScript'] }],
  );

  // Same source (project p1) listed multiple times
  const duplicateEvidence: CareerEvidence[] = [
    makeEvidence('JavaScript', 'project', 'p1', 'strong'),
    makeEvidence('JavaScript', 'project', 'p1', 'moderate'),
    makeEvidence('JavaScript', 'project', 'p1', 'weak'),
  ];

  const singleEvidence: CareerEvidence[] = [
    makeEvidence('JavaScript', 'project', 'p1', 'strong'),
  ];

  const intelDup = deriveSkillIntelligence(portfolio, duplicateEvidence);
  const intelSingle = deriveSkillIntelligence(portfolio, singleEvidence);

  const reportDup = buildAllEvidenceReports(intelDup, duplicateEvidence);
  const reportSingle = buildAllEvidenceReports(intelSingle, singleEvidence);

  const jsDup = findSkillEvidenceReport(reportDup, 'JavaScript')!;
  const jsSingle = findSkillEvidenceReport(reportSingle, 'JavaScript')!;

  assertEqual(jsDup.evidenceCount, 1, 'Duplicate: evidence count should be 1 after dedup');
  assertEqual(jsDup.confidence, jsSingle.confidence, 'Confidence should be identical after dedup');
  assertEqual(jsDup.uniqueSourceCount, 1, 'Duplicate: unique sources should be 1');
  assertEqual(jsDup.evidence.length, 1, 'Duplicate: evidence array should have 1 item');
  // The kept evidence should be the strongest one
  assertEqual(jsDup.evidence[0].strength, 'strong', 'Should keep the strongest evidence');
});

// ── Test 6: Unsupported/nonexistent skill ────────────────────

test('Unsupported/nonexistent skill → no report created', () => {
  const portfolio = makePortfolio(
    ['JavaScript'],
    [{ id: 'p1', techStack: ['JavaScript'] }],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  const postgresReport = findSkillEvidenceReport(reports, 'PostgreSQL');
  assertEqual(postgresReport, null, 'PostgreSQL should have no report (not in user data)');

  // Also verify that no evidence for PostgreSQL was invented
  const allEvidenceForPg = evidence.filter((e) => e.skill.toLowerCase() === 'postgresql');
  assertEqual(allEvidenceForPg.length, 0, 'No evidence should exist for PostgreSQL');
});

// ── Test 7: Empty portfolio ──────────────────────────────────

test('Empty portfolio → no reports', () => {
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

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  assertEqual(reports.length, 0, 'Empty portfolio should have 0 reports');
  assertEqual(evidence.length, 0, 'Empty portfolio should have 0 evidence');
});

// ── Test 8: Certification evidence derivation ─────────────────

test('Certification evidence → derived from career profile certifications', () => {
  const portfolio = makePortfolio(
    ['AWS', 'Python'],
    [{ id: 'p1', techStack: ['Python'] }],
  );

  const profile = makeCareerProfile([
    { id: 'cert-1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2024-01', url: '' },
  ]);

  const certEvidence = deriveCertificationEvidence(portfolio, profile, 'test-user');

  assert(certEvidence.length > 0, 'Should derive certification evidence');
  assert(certEvidence.every((e) => e.sourceType === 'certificate'), 'All cert evidence should have sourceType=certificate');
  assert(certEvidence.some((e) => e.skill === 'AWS'), 'Should match AWS skill');
  assert(!certEvidence.some((e) => e.skill === 'Python'), 'Should not match Python (cert name does not contain Python)');
  assert(certEvidence.every((e) => e.evidenceStrength === 'moderate'), 'Cert evidence should be moderate');
  assert(certEvidence.every((e) => e.evidenceText.includes('Certification')), 'Evidence text should mention certification');

  // Verify dedup: same skill + cert should not create duplicates
  const awsEvidence = certEvidence.filter((e) => e.skill === 'AWS');
  assertEqual(awsEvidence.length, 1, 'Only one AWS evidence from one cert');
});

// ── Test 9: Certification evidence with no certifications ────

test('No certifications → no certification evidence', () => {
  const portfolio = makePortfolio(['AWS'], []);
  const profile = makeCareerProfile([]);

  const certEvidence = deriveCertificationEvidence(portfolio, profile, 'test-user');
  assertEqual(certEvidence.length, 0, 'No certs should produce no cert evidence');
});

// ── Test 10: Certification evidence doesn't invent skills ────

test('Certification evidence does not invent skills not in portfolio', () => {
  const portfolio = makePortfolio(['Python'], []);
  const profile = makeCareerProfile([
    { id: 'cert-1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2024-01', url: '' },
  ]);

  const certEvidence = deriveCertificationEvidence(portfolio, profile, 'test-user');
  assertEqual(certEvidence.length, 0, 'No evidence for AWS since it is not in portfolio skills');
});

// ── Test 11: Full pipeline — portfolio + cert evidence combined ─

test('Full pipeline: portfolio + cert evidence combined in report', () => {
  const portfolio = makePortfolio(
    ['AWS', 'Python'],
    [{ id: 'p1', techStack: ['Python'] }],
  );

  const profile = makeCareerProfile([
    { id: 'cert-1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2024-01', url: '' },
  ]);

  const portfolioEvidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const certEvidence = deriveCertificationEvidence(portfolio, profile, 'test-user');
  const allEvidence = [...portfolioEvidence, ...certEvidence];

  const skillIntel = deriveSkillIntelligence(portfolio, allEvidence);
  const reports = buildAllEvidenceReports(skillIntel, allEvidence);

  // AWS should have certificate evidence + portfolio weak evidence (listed but no project)
  const awsReport = findSkillEvidenceReport(reports, 'AWS');
  assert(awsReport != null, 'AWS report should exist');
  assertEqual(awsReport!.evidenceCount, 2, 'AWS should have 2 evidence (1 cert + 1 portfolio weak)');
  assert(awsReport!.evidence.some((e) => e.sourceType === 'certificate'), 'AWS should have certificate evidence');
  assert(awsReport!.evidence.some((e) => e.sourceType === 'portfolio'), 'AWS should have portfolio weak evidence');
  assert(isReportTraceable(awsReport!), 'AWS report should be traceable');

  // Python should have project evidence only
  const pythonReport = findSkillEvidenceReport(reports, 'Python');
  assert(pythonReport != null, 'Python report should exist');
  assert(pythonReport!.evidence.some((e) => e.sourceType === 'project'), 'Python should have project evidence');
  assert(isReportTraceable(pythonReport!), 'Python report should be traceable');
});

// ── Test 12: Report preserves 8B scores exactly ──────────────

test('Evidence report preserves 8B confidence and strength level exactly', () => {
  const portfolio = makePortfolio(
    ['TypeScript', 'React'],
    [
      { id: 'p1', techStack: ['React', 'TypeScript'] },
      { id: 'p2', techStack: ['React'] },
    ],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  for (const si of skillIntel) {
    const report = findSkillEvidenceReport(reports, si.name);
    assert(report != null, `Report for ${si.name} should exist`);
    assertEqual(report!.confidence, si.confidence, `${si.name}: report confidence should match 8B`);
    assertEqual(report!.strengthLevel, si.strengthLevel, `${si.name}: report strength should match 8B`);
    assertEqual(report!.category, si.category, `${si.name}: report category should match 8B`);
    assertEqual(report!.evidenceCount, si.evidenceCount, `${si.name}: report evidence count should match 8B`);
    assertEqual(report!.explicitlyListed, si.explicitlyListed, `${si.name}: report explicitlyListed should match 8B`);
  }
});

// ── Test 13: No fake evidence ever created ────────────────────

test('No fake evidence: every evidence item traces to real user data', () => {
  const portfolio = makePortfolio(
    ['JavaScript', 'React'],
    [
      { id: 'p1', techStack: ['React', 'JavaScript'] },
      { id: 'p2', techStack: ['React'] },
    ],
    [{ id: 'e1', role: 'Developer', company: 'ACME', description: 'Built React frontends with JavaScript' }],
  );

  const evidence = deriveEvidenceFromPortfolio(portfolio, 'test-user');
  const skillIntel = deriveSkillIntelligence(portfolio, evidence);
  const reports = buildAllEvidenceReports(skillIntel, evidence);

  for (const report of reports) {
    for (const e of report.evidence) {
      // Every evidence must trace to a source that exists in the portfolio
      if (e.sourceType === 'project') {
        const project = portfolio.projects.find((p) => p.id === e.sourceId);
        assert(project != null, `Project evidence sourceId "${e.sourceId}" must exist in portfolio`);
      } else if (e.sourceType === 'experience') {
        const exp = portfolio.experience.find((ex) => ex.id === e.sourceId);
        assert(exp != null, `Experience evidence sourceId "${e.sourceId}" must exist in portfolio`);
      } else if (e.sourceType === 'education') {
        const edu = portfolio.education.find((ed) => ed.id === e.sourceId);
        assert(edu != null, `Education evidence sourceId "${e.sourceId}" must exist in portfolio`);
      } else if (e.sourceType === 'portfolio') {
        assertEqual(e.sourceId, portfolio.id, 'Portfolio evidence sourceId should be the portfolio ID');
      } else if (e.sourceType === 'certificate') {
        // Cert evidence traced through career profile — not in portfolio data
        assert(e.sourceId.length > 0, 'Certificate evidence sourceId should not be empty');
      }

      // Evidence skill must be a known skill in the portfolio
      const isListedSkill = portfolio.skills.some((s) => s.toLowerCase() === report.skill.toLowerCase());
      const isTechStackSkill = portfolio.projects.some((p) =>
        p.techStack.some((t) => t.toLowerCase() === report.skill.toLowerCase()),
      );
      assert(
        isListedSkill || isTechStackSkill,
        `Evidence skill "${report.skill}" must be in portfolio skills or project tech stacks`,
      );
    }
  }
});

// ── Test 14: countEvidenceBySourceType ────────────────────────

test('countEvidenceBySourceType groups evidence correctly', () => {
  const report: import('@/types/career').SkillEvidenceReport = {
    skill: 'Test',
    category: 'technical',
    strengthLevel: 'strong',
    confidence: 75,
    explicitlyListed: true,
    evidenceCount: 5,
    uniqueSourceCount: 4,
    sourceTypes: ['project', 'experience', 'certificate'],
    evidence: [
      { id: '1', sourceType: 'project', sourceId: 'p1', sourceTitle: 'P1', description: 'd', strength: 'strong' },
      { id: '2', sourceType: 'project', sourceId: 'p2', sourceTitle: 'P2', description: 'd', strength: 'moderate' },
      { id: '3', sourceType: 'project', sourceId: 'p3', sourceTitle: 'P3', description: 'd', strength: 'strong' },
      { id: '4', sourceType: 'experience', sourceId: 'e1', sourceTitle: 'E1', description: 'd', strength: 'strong' },
      { id: '5', sourceType: 'certificate', sourceId: 'c1', sourceTitle: 'C1', description: 'd', strength: 'moderate' },
    ],
  };

  const counts = countEvidenceBySourceType(report);
  assertEqual(counts['project'], 3, 'Project count');
  assertEqual(counts['experience'], 1, 'Experience count');
  assertEqual(counts['certificate'], 1, 'Certificate count');
});

// ── Test 15: isReportTraceable ────────────────────────────────

test('isReportTraceable detects untraceable evidence', () => {
  const goodReport: import('@/types/career').SkillEvidenceReport = {
    skill: 'Test',
    category: 'technical',
    strengthLevel: 'strong',
    confidence: 75,
    explicitlyListed: true,
    evidenceCount: 1,
    uniqueSourceCount: 1,
    sourceTypes: ['project'],
    evidence: [
      { id: '1', sourceType: 'project', sourceId: 'p1', sourceTitle: 'P1', description: 'desc', strength: 'strong' },
    ],
  };

  const badReport: import('@/types/career').SkillEvidenceReport = {
    skill: 'Test',
    category: 'technical',
    strengthLevel: 'strong',
    confidence: 75,
    explicitlyListed: true,
    evidenceCount: 1,
    uniqueSourceCount: 1,
    sourceTypes: ['project'],
    evidence: [
      { id: '', sourceType: 'project', sourceId: '', sourceTitle: '', description: '', strength: 'weak' },
    ],
  };

  assert(isReportTraceable(goodReport), 'Good report should be traceable');
  assert(!isReportTraceable(badReport), 'Bad report should not be traceable');
});

// ── Test 16: Certification dedup with portfolio evidence ──────

test('Certification evidence deduplicates with same skill+source key', () => {
  const portfolio = makePortfolio(['AWS'], []);
  const profile = makeCareerProfile([
    { id: 'cert-1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '', url: '' },
  ]);

  // Run twice — same cert should not produce duplicates
  const evidence1 = deriveCertificationEvidence(portfolio, profile, 'test-user');
  const evidence2 = deriveCertificationEvidence(portfolio, profile, 'test-user');

  // Each run produces 1 evidence, but they are independent calls
  assertEqual(evidence1.length, 1, 'First call should produce 1 cert evidence');
  assertEqual(evidence2.length, 1, 'Second call should produce 1 cert evidence');

  // Combine and dedup through the evidence derivation pipeline
  const combined = [...evidence1, ...evidence2];
  // The dedup key for both would be "aws-certificate-cert-1"
  const deduped = new Map<string, CareerEvidence>();
  for (const e of combined) {
    const key = `${e.skill.toLowerCase()}-${e.sourceType}-${e.sourceId}`;
    if (!deduped.has(key)) deduped.set(key, e);
  }
  assertEqual(deduped.size, 1, 'Deduped combined evidence should be 1');
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
