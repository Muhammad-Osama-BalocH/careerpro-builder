import type {
  DerivedSkillIntelligence,
  RoleSkillRequirement,
  RoleSkillProfile,
  CareerGapDetail,
  CareerGapAnalysis,
  GapPriority,
  GapStatus,
  EvidenceLevel,
} from '@/types/career';

// ── Role Skill Requirements ─────────────────────────────────
//
// Deterministic mapping of common developer roles to required skills.
// Extensible: add new roles or skills as needed.
// No AI — every requirement is explicitly defined.

const ROLE_SKILL_PROFILES: RoleSkillProfile[] = [
  {
    role: 'frontend developer',
    skills: [
      { skill: 'html', importance: 'core', description: 'Structuring web content with semantic HTML' },
      { skill: 'css', importance: 'core', description: 'Styling and responsive layout' },
      { skill: 'javascript', importance: 'core', description: 'Core programming language for the browser' },
      { skill: 'typescript', importance: 'important', description: 'Type-safe JavaScript development' },
      { skill: 'react', importance: 'core', description: 'Component-based UI development' },
      { skill: 'responsive design', importance: 'core', description: 'Building layouts that work across devices' },
      { skill: 'apis', importance: 'important', description: 'Consuming REST and GraphQL APIs' },
      { skill: 'version control', importance: 'important', description: 'Git for source code management' },
      { skill: 'testing', importance: 'helpful', description: 'Unit and integration testing' },
    ],
  },
  {
    role: 'backend developer',
    skills: [
      { skill: 'node.js', importance: 'core', description: 'Server-side JavaScript runtime' },
      { skill: 'rest apis', importance: 'core', description: 'Designing and building RESTful endpoints' },
      { skill: 'authentication', importance: 'core', description: 'Implementing auth flows and security' },
      { skill: 'databases', importance: 'core', description: 'Data modeling, queries, and management' },
      { skill: 'api security', importance: 'important', description: 'Securing endpoints and data access' },
      { skill: 'javascript', importance: 'important', description: 'Core language for Node.js development' },
      { skill: 'version control', importance: 'important', description: 'Git for source code management' },
      { skill: 'testing', importance: 'helpful', description: 'API and integration testing' },
      { skill: 'deployment', importance: 'helpful', description: 'Deploying and managing server applications' },
    ],
  },
  {
    role: 'ai engineer',
    skills: [
      { skill: 'python', importance: 'core', description: 'Primary language for ML/AI development' },
      { skill: 'machine learning', importance: 'core', description: 'Building and training ML models' },
      { skill: 'data analysis', importance: 'core', description: 'Analyzing and preprocessing datasets' },
      { skill: 'apis', importance: 'core', description: 'Building and deploying AI-powered APIs' },
      { skill: 'databases', importance: 'important', description: 'Managing training data and results' },
      { skill: 'version control', importance: 'important', description: 'Git for model and code management' },
      { skill: 'testing', importance: 'important', description: 'Validating model performance and reliability' },
      { skill: 'deployment', importance: 'important', description: 'Deploying models to production environments' },
      { skill: 'javascript', importance: 'helpful', description: 'Building AI-powered web applications' },
    ],
  },
  {
    role: 'full-stack developer',
    skills: [
      { skill: 'frontend fundamentals', importance: 'core', description: 'HTML, CSS, and JavaScript for the browser' },
      { skill: 'react', importance: 'core', description: 'Component-based UI framework' },
      { skill: 'typescript', importance: 'important', description: 'Type-safe development across the stack' },
      { skill: 'javascript', importance: 'core', description: 'Core language for both frontend and backend' },
      { skill: 'rest apis', importance: 'core', description: 'Designing and consuming API endpoints' },
      { skill: 'authentication', importance: 'core', description: 'Implementing auth and session management' },
      { skill: 'databases', importance: 'core', description: 'Data storage, modeling, and queries' },
      { skill: 'deployment', importance: 'important', description: 'Deploying full applications to production' },
      { skill: 'version control', importance: 'important', description: 'Git for source code management' },
      { skill: 'testing', importance: 'helpful', description: 'End-to-end and integration testing' },
    ],
  },
];

// ── Role Lookup ─────────────────────────────────────────────

/**
 * Find a role skill profile by name (case-insensitive, partial match).
 * Returns null if no matching role is found.
 */
export function findRoleProfile(roleName: string): RoleSkillProfile | null {
  if (!roleName.trim()) return null;
  const lower = roleName.toLowerCase().trim();
  return ROLE_SKILL_PROFILES.find((p) => p.role === lower) ?? null;
}

/**
 * Get all available role names for UI display.
 */
export function getAvailableRoles(): string[] {
  return ROLE_SKILL_PROFILES.map((p) => p.role);
}

/**
 * Resolve the target role from the career profile.
 * Uses `targetRoles` first (most explicit), then falls back to `professionalTitle`.
 * Returns null if no target career can be determined.
 */
export function resolveTargetRole(
  targetRoles: string[],
  professionalTitle: string,
): string | null {
  if (targetRoles.length > 0) {
    const match = findRoleProfile(targetRoles[0]);
    if (match) return match.role;
  }
  if (professionalTitle.trim()) {
    const match = findRoleProfile(professionalTitle);
    if (match) return match.role;
  }
  return null;
}

// ── Evidence Level Classification ───────────────────────────

function classifyEvidenceLevel(si: DerivedSkillIntelligence | undefined): EvidenceLevel {
  if (!si || si.evidenceCount === 0) return 'none';
  if (si.strengthLevel === 'emerging') return 'weak';
  if (si.strengthLevel === 'developing') return 'moderate';
  if (si.strengthLevel === 'strong') return 'strong';
  // advanced
  return 'strong';
}

function classifyGapStatus(si: DerivedSkillIntelligence | undefined): GapStatus {
  if (!si || si.evidenceCount === 0) return 'missing';
  if (si.strengthLevel === 'emerging') return 'weak_evidence';
  if (si.strengthLevel === 'developing') return 'developing';
  // strong or advanced
  return 'demonstrated';
}

// ── Priority Calculation ────────────────────────────────────
//
// Priority depends on:
//   - skill importance for the role (core > important > helpful)
//   - current evidence level (none > weak > moderate)
//   - whether evidence is completely missing
//
// Core skill with no evidence → high
// Core skill with weak evidence → high
// Important skill with no evidence → high
// Important skill with weak evidence → medium
// Helpful skill with no evidence → medium
// Helpful skill with weak evidence → low
// Any skill with moderate evidence → not a gap (demonstrated)

function calculatePriority(
  importance: RoleSkillRequirement['importance'],
  evidenceLevel: EvidenceLevel,
): GapPriority {
  if (evidenceLevel === 'moderate') return 'low'; // shouldn't be a gap, but safety net

  const isMissing = evidenceLevel === 'none';

  if (importance === 'core') {
    return isMissing ? 'high' : 'high'; // core skills are always high if not demonstrated
  }
  if (importance === 'important') {
    return isMissing ? 'high' : 'medium';
  }
  // helpful
  return isMissing ? 'medium' : 'low';
}

// ── Missing Evidence Description ─────────────────────────────

function describeMissingEvidence(
  requirement: RoleSkillRequirement,
  status: GapStatus,
  si: DerivedSkillIntelligence | undefined,
): string {
  if (status === 'missing') {
    return `No evidence for ${requirement.skill}. Expected: ${requirement.description}`;
  }
  if (status === 'weak_evidence') {
    const count = si?.evidenceCount ?? 0;
    return `Weak evidence (${count} source${count !== 1 ? 's' : ''}) for ${requirement.skill}. Needs: ${requirement.description}`;
  }
  if (status === 'developing') {
    return `Developing ${requirement.skill} — more ${requirement.importance === 'core' ? 'project or experience' : 'hands-on'} evidence needed`;
  }
  return '';
}

// ── Skill Matching ──────────────────────────────────────────
//
// Match a required skill from a role profile against the user's
// demonstrated skills. Uses case-insensitive comparison and
// considers known aliases/overlaps.

const SKILL_ALIASES: Record<string, string[]> = {
  'html': ['html5'],
  'css': ['css3', 'tailwind css', 'tailwind', 'sass', 'scss', 'bootstrap'],
  'javascript': ['js', 'es6'],
  'typescript': ['ts'],
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs'],
  'node.js': ['nodejs', 'node', 'express', 'express.js', 'nestjs'],
  'rest apis': ['api development', 'api', 'apis', 'rest api', 'graphql', 'rest'],
  'authentication': ['auth', 'oauth', 'jwt'],
  'databases': ['database', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase', 'firestore'],
  'responsive design': ['responsive', 'mobile-first'],
  'version control': ['git', 'github'],
  'deployment': ['devops', 'docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp', 'vercel', 'netlify'],
  'testing': ['jest', 'vitest', 'cypress', 'playwright', 'unit testing'],
  'frontend fundamentals': ['html', 'css', 'javascript', 'frontend development'],
  'api security': ['security', 'oauth', 'encryption'],
  'python': ['python3', 'py'],
  'machine learning': ['ml', 'deep learning', 'tensorflow', 'pytorch', 'neural networks', 'ai'],
  'data analysis': ['pandas', 'numpy', 'data science', 'analytics', 'data visualization'],
  'apis': ['api development', 'api', 'rest api', 'rest apis', 'graphql', 'rest', 'fastapi', 'flask'],
};

function skillMatches(requiredSkill: string, userSkill: string): boolean {
  const reqLower = requiredSkill.toLowerCase();
  const userLower = userSkill.toLowerCase();

  if (reqLower === userLower) return true;

  // Check if user skill is an alias for the required skill
  const aliases = SKILL_ALIASES[reqLower];
  if (aliases && aliases.some((a) => a === userLower)) return true;

  // Check reverse: is required skill an alias of user skill?
  const userAliases = SKILL_ALIASES[userLower];
  if (userAliases && userAliases.some((a) => a === reqLower)) return true;

  return false;
}

function findMatchingSkillIntelligence(
  requirement: RoleSkillRequirement,
  skillIntelligence: DerivedSkillIntelligence[],
): DerivedSkillIntelligence | undefined {
  return skillIntelligence.find((si) => skillMatches(requirement.skill, si.name));
}

// ── Main Gap Analysis ───────────────────────────────────────

/**
 * Perform career gap analysis by comparing role requirements
 * against the user's demonstrated skills from 8B/8C.
 *
 * Pure deterministic computation — no AI, no randomness.
 * Every gap traces to: required skill + actual evidence.
 *
 * Returns a no-target-role result if no target role can be resolved.
 */
export function analyzeCareerGaps(
  skillIntelligence: DerivedSkillIntelligence[],
  targetRoles: string[],
  professionalTitle: string,
): CareerGapAnalysis {
  const targetRole = resolveTargetRole(targetRoles, professionalTitle);

  if (!targetRole) {
    return {
      targetRole: '',
      requiredSkills: [],
      demonstratedSkills: [],
      gaps: [],
    };
  }

  const roleProfile = findRoleProfile(targetRole);
  if (!roleProfile) {
    // Should not happen since resolveTargetRole found a match
    return { targetRole, requiredSkills: [], demonstratedSkills: [], gaps: [] };
  }

  const demonstratedSkills: string[] = [];
  const gaps: CareerGapDetail[] = [];

  for (const requirement of roleProfile.skills) {
    const si = findMatchingSkillIntelligence(requirement, skillIntelligence);
    const status = classifyGapStatus(si);
    const evidenceLevel = classifyEvidenceLevel(si);

    if (status === 'demonstrated') {
      demonstratedSkills.push(requirement.skill);
      continue; // no gap for demonstrated skills
    }

    const priority = calculatePriority(requirement.importance, evidenceLevel);
    const missingEvidence = describeMissingEvidence(requirement, status, si);

    gaps.push({
      skill: requirement.skill,
      targetRole,
      status,
      currentEvidenceLevel: evidenceLevel,
      requiredEvidenceLevel: requirement.importance === 'core' ? 'strong' : 'moderate',
      missingEvidence,
      priority,
      relatedEvidenceIds: si?.evidenceIds ?? [],
    });
  }

  // Sort gaps: high priority first, then by importance (core > important > helpful)
  const importanceOrder: Record<RoleSkillRequirement['importance'], number> = { core: 3, important: 2, helpful: 1 };
  gaps.sort((a, b) => {
    const prioOrder: Record<GapPriority, number> = { high: 3, medium: 2, low: 1 };
    const prioDiff = prioOrder[b.priority] - prioOrder[a.priority];
    if (prioDiff !== 0) return prioDiff;
    const reqA = roleProfile.skills.find((s) => s.skill === a.skill);
    const reqB = roleProfile.skills.find((s) => s.skill === b.skill);
    return (importanceOrder[reqB?.importance ?? 'helpful']) - (importanceOrder[reqA?.importance ?? 'helpful']);
  });

  return {
    targetRole,
    requiredSkills: roleProfile.skills,
    demonstratedSkills,
    gaps,
  };
}
