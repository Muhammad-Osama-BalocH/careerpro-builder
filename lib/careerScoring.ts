import type { Portfolio } from '@/types/portfolio';
import type { CareerProfile, CareerEvidence, CareerGapAnalysis } from '@/types/career';

// ── Category Scores ──────────────────────────────────────────

export interface CategoryScore {
  label: string;
  score: number; // 0-100
  explanation: string;
}

export interface CareerReadiness {
  overall: number; // 0-100
  categories: CategoryScore[];
}

/**
 * Pure deterministic scoring. No AI. No randomness.
 * Every score is derived from actual user data and fully explainable.
 */
export function calculateCareerReadiness(
  portfolio: Portfolio | null,
  profile: CareerProfile | null,
  evidence: CareerEvidence[],
): CareerReadiness {
  const skills = calculateSkillsScore(portfolio, evidence);
  const experience = calculateExperienceScore(portfolio);
  const projects = calculateProjectsScore(portfolio);
  const evidenceScore = calculateEvidenceScore(evidence, portfolio);
  const completeness = calculateProfileCompleteness(portfolio, profile);

  const categories = [skills, experience, projects, evidenceScore, completeness];

  const weights = [0.20, 0.20, 0.20, 0.25, 0.15];
  const overall = Math.round(
    categories.reduce((sum, cat, i) => sum + cat.score * weights[i], 0),
  );

  return { overall, categories };
}

// ── Skills Score (20%) ──────────────────────────────────────

function calculateSkillsScore(portfolio: Portfolio | null, evidence: CareerEvidence[]): CategoryScore {
  if (!portfolio || portfolio.skills.length === 0) {
    return { label: 'Skills Strength', score: 0, explanation: 'No skills listed in portfolio.' };
  }

  const total = portfolio.skills.length;
  const skillsWithEvidence = new Set(
    evidence.filter((e) => e.evidenceStrength !== 'weak').map((e) => e.skill.toLowerCase()),
  );
  const strongCount = new Set(
    evidence.filter((e) => e.evidenceStrength === 'strong').map((e) => e.skill.toLowerCase()),
  ).size;
  const coveredCount = skillsWithEvidence.size;

  // Base: having skills at all (up to 40 pts for 5+ skills)
  const breadthPts = Math.min(40, total * 8);

  // Evidence coverage: % of skills with non-weak evidence (up to 40 pts)
  const coverageRatio = coveredCount / total;
  const coveragePts = Math.round(coverageRatio * 40);

  // Strong evidence bonus: % of skills with strong evidence (up to 20 pts)
  const strongRatio = strongCount / total;
  const strongPts = Math.round(strongRatio * 20);

  const score = Math.min(100, breadthPts + coveragePts + strongPts);

  return {
    label: 'Skills Strength',
    score,
    explanation: `${total} skill${total !== 1 ? 's' : ''} listed · ${coveredCount} with supporting evidence · ${strongCount} with strong evidence`,
  };
}

// ── Experience Score (20%) ──────────────────────────────────

function calculateExperienceScore(portfolio: Portfolio | null): CategoryScore {
  if (!portfolio || portfolio.experience.length === 0) {
    return { label: 'Experience Strength', score: 0, explanation: 'No experience entries in portfolio.' };
  }

  const total = portfolio.experience.length;
  const withDesc = portfolio.experience.filter((e) => e.description?.trim()).length;
  const withCompany = portfolio.experience.filter((e) => e.company?.trim()).length;

  // Having entries (up to 40 pts for 3+)
  const countPts = Math.min(40, total * 13);

  // Descriptions (up to 40 pts)
  const descRatio = withDesc / total;
  const descPts = Math.round(descRatio * 40);

  // Company names (up to 20 pts)
  const companyRatio = withCompany / total;
  const companyPts = Math.round(companyRatio * 20);

  const score = Math.min(100, countPts + descPts + companyPts);

  return {
    label: 'Experience Strength',
    score,
    explanation: `${total} experience entr${total !== 1 ? 'ies' : 'y'} · ${withDesc} with descriptions · ${withCompany} with company names`,
  };
}

// ── Projects Score (20%) ────────────────────────────────────

function calculateProjectsScore(portfolio: Portfolio | null): CategoryScore {
  if (!portfolio || portfolio.projects.length === 0) {
    return { label: 'Project Strength', score: 0, explanation: 'No projects in portfolio.' };
  }

  const total = portfolio.projects.length;
  const withDesc = portfolio.projects.filter((p) => p.description?.trim()).length;
  const withTech = portfolio.projects.filter((p) => p.techStack.length > 0).length;

  // Having projects (up to 40 pts for 3+)
  const countPts = Math.min(40, total * 13);

  // Descriptions (up to 35 pts)
  const descRatio = withDesc / total;
  const descPts = Math.round(descRatio * 35);

  // Tech stacks (up to 25 pts)
  const techRatio = withTech / total;
  const techPts = Math.round(techRatio * 25);

  const score = Math.min(100, countPts + descPts + techPts);

  return {
    label: 'Project Strength',
    score,
    explanation: `${total} project${total !== 1 ? 's' : ''} · ${withDesc} with descriptions · ${withTech} with tech stacks`,
  };
}

// ── Evidence Score (25%) ────────────────────────────────────

function calculateEvidenceScore(evidence: CareerEvidence[], portfolio: Portfolio | null): CategoryScore {
  if (evidence.length === 0) {
    return { label: 'Evidence Strength', score: 0, explanation: 'No career evidence built yet.' };
  }

  const totalSkills = portfolio?.skills.length ?? 0;
  const uniqueSkills = new Set(evidence.map((e) => e.skill.toLowerCase())).size;
  const strongCount = evidence.filter((e) => e.evidenceStrength === 'strong').length;
  const moderateCount = evidence.filter((e) => e.evidenceStrength === 'moderate').length;
  const weakCount = evidence.filter((e) => e.evidenceStrength === 'weak').length;
  const total = evidence.length;

  // Skills with evidence coverage (up to 40 pts)
  const coverageRatio = totalSkills > 0 ? uniqueSkills / totalSkills : 0;
  const coveragePts = Math.round(coverageRatio * 40);

  // Quality distribution: strong vs moderate vs weak (up to 40 pts)
  const qualityRatio = (strongCount * 1.0 + moderateCount * 0.5 + weakCount * 0.1) / Math.max(total, 1);
  const qualityPts = Math.round(qualityRatio * 40);

  // Volume: number of evidence records (up to 20 pts for 10+)
  const volumePts = Math.min(20, total * 2);

  const score = Math.min(100, coveragePts + qualityPts + volumePts);

  return {
    label: 'Evidence Strength',
    score,
    explanation: `${totalSkills} skill${totalSkills !== 1 ? 's' : ''} found · ${uniqueSkills} with evidence · ${strongCount} strong · ${moderateCount} moderate · ${weakCount} weak`,
  };
}

// ── Profile Completeness (15%) ──────────────────────────────

export interface CompletenessArea {
  label: string;
  complete: boolean;
}

export interface ProfileCompletenessResult {
  label: string;
  score: number; // 0-100
  explanation: string;
  completed: number;
  total: number;
  areas: CompletenessArea[];
}

export function calculateProfileCompleteness(
  portfolio: Portfolio | null,
  profile: CareerProfile | null,
): ProfileCompletenessResult {
  const areas: CompletenessArea[] = [
    { label: 'Name', complete: Boolean(portfolio?.name?.trim()) },
    { label: 'Professional title', complete: Boolean(portfolio?.title?.trim() || profile?.professionalTitle?.trim()) },
    { label: 'Email', complete: Boolean(portfolio?.email?.trim()) },
    { label: 'About', complete: Boolean(portfolio?.about?.trim()) },
    { label: 'Skills', complete: (portfolio?.skills.length ?? 0) > 0 },
    { label: 'Experience', complete: (portfolio?.experience.length ?? 0) > 0 },
    { label: 'Education', complete: (portfolio?.education.length ?? 0) > 0 },
    { label: 'Projects', complete: (portfolio?.projects.length ?? 0) > 0 },
    { label: 'Certifications', complete: (profile?.certifications.length ?? 0) > 0 },
    { label: 'Achievements', complete: (profile?.achievements.length ?? 0) > 0 },
    { label: 'Online presence', complete: Boolean(portfolio?.githubUrl?.trim() || portfolio?.linkedinUrl?.trim() || profile?.githubUrl?.trim() || profile?.linkedinUrl?.trim()) },
  ];

  const completed = areas.filter((a) => a.complete).length;
  const total = areas.length;
  const score = Math.round((completed / total) * 100);

  return {
    label: 'Profile Completeness',
    score,
    explanation: `${completed} / ${total} areas completed`,
    completed,
    total,
    areas,
  };
}

// ── Career Strengths ─────────────────────────────────────────

export interface CareerStrength {
  text: string;
  detail?: string;
}

export function deriveStrengths(
  portfolio: Portfolio | null,
  profile: CareerProfile | null,
  evidence: CareerEvidence[],
): CareerStrength[] {
  const strengths: CareerStrength[] = [];

  if (!portfolio && !profile) return strengths;

  // Skills coverage
  const skillCount = portfolio?.skills.length ?? 0;
  if (skillCount >= 8) {
    strengths.push({ text: 'Strong technical skill coverage', detail: `${skillCount} skills listed` });
  } else if (skillCount >= 4) {
    strengths.push({ text: 'Good skill selection', detail: `${skillCount} skills listed` });
  }

  // Projects
  const projCount = portfolio?.projects.length ?? 0;
  if (projCount >= 3) {
    strengths.push({ text: 'Multiple portfolio projects', detail: `${projCount} projects showcasing work` });
  } else if (projCount >= 1) {
    strengths.push({ text: 'Portfolio projects available', detail: `${projCount} project added` });
  }

  // Experience
  const expCount = portfolio?.experience.length ?? 0;
  const expWithDesc = portfolio?.experience.filter((e) => e.description?.trim()).length ?? 0;
  if (expCount >= 3 && expWithDesc >= 2) {
    strengths.push({ text: 'Strong professional experience', detail: `${expCount} entries with detailed descriptions` });
  } else if (expCount >= 1) {
    strengths.push({ text: 'Professional experience available', detail: `${expCount} experience entr${expCount !== 1 ? 'ies' : 'y'}` });
  }

  // Evidence quality
  const strongEvidence = evidence.filter((e) => e.evidenceStrength === 'strong').length;
  const uniqueSkillsWithEvidence = new Set(evidence.filter((e) => e.evidenceStrength !== 'weak').map((e) => e.skill)).size;
  if (strongEvidence >= 3) {
    strengths.push({ text: 'Strong evidence for key skills', detail: `${strongEvidence} strong evidence records` });
  }
  if (uniqueSkillsWithEvidence >= 3) {
    strengths.push({ text: 'Skills backed by evidence', detail: `${uniqueSkillsWithEvidence} skills have supporting sources` });
  }

  // Contact completeness
  const hasEmail = Boolean(portfolio?.email?.trim());
  const hasLinks = Boolean(portfolio?.githubUrl?.trim() || portfolio?.linkedinUrl?.trim());
  if (hasEmail && hasLinks) {
    strengths.push({ text: 'Complete contact and online presence', detail: 'Email and professional links provided' });
  }

  // Certifications
  const certCount = profile?.certifications.length ?? 0;
  if (certCount >= 1) {
    strengths.push({ text: 'Professional certifications', detail: `${certCount} certification${certCount !== 1 ? 's' : ''} added` });
  }

  return strengths;
}

// ── Career Gaps ──────────────────────────────────────────────

export interface CareerGap {
  text: string;
  detail?: string;
}

export function deriveGaps(
  portfolio: Portfolio | null,
  profile: CareerProfile | null,
  evidence: CareerEvidence[],
): CareerGap[] {
  const gaps: CareerGap[] = [];

  if (!portfolio && !profile) {
    gaps.push({ text: 'No portfolio or career profile data', detail: 'Start by creating a portfolio in the Builder' });
    return gaps;
  }

  // No projects
  if ((portfolio?.projects.length ?? 0) === 0) {
    gaps.push({ text: 'No projects added', detail: 'Add projects to showcase your work' });
  }

  // No experience
  if ((portfolio?.experience.length ?? 0) === 0) {
    gaps.push({ text: 'No work experience listed', detail: 'Add professional experience to strengthen your profile' });
  }

  // Limited experience evidence (descriptions)
  const expNoDesc = portfolio?.experience.filter((e) => !e.description?.trim()).length ?? 0;
  if (expNoDesc > 0) {
    gaps.push({ text: 'Limited experience descriptions', detail: `${expNoDesc} experience entr${expNoDesc !== 1 ? 'ies lack' : 'y lacks'} a description` });
  }

  // No certifications
  if ((profile?.certifications.length ?? 0) === 0) {
    gaps.push({ text: 'Missing certifications', detail: 'Adding certifications strengthens credibility' });
  }

  // Skills without supporting evidence
  if (portfolio && evidence.length > 0) {
    const skillsWithEvidence = new Set(evidence.filter((e) => e.evidenceStrength !== 'weak').map((e) => e.skill.toLowerCase()));
    const orphanSkills = portfolio.skills.filter((s) => !skillsWithEvidence.has(s.toLowerCase()));
    if (orphanSkills.length > 0 && orphanSkills.length <= 5) {
      gaps.push({ text: 'Skills without supporting evidence', detail: `${orphanSkills.join(', ')} lack project or experience evidence` });
    } else if (orphanSkills.length > 5) {
      gaps.push({ text: `${orphanSkills.length} skills without supporting evidence`, detail: 'Add projects or experience that demonstrate these skills' });
    }
  } else if (portfolio && portfolio.skills.length > 0 && evidence.length === 0) {
    gaps.push({ text: 'No evidence built for skills', detail: 'Build evidence to show where your skills are demonstrated' });
  }

  // Incomplete professional profile
  const missingFields: string[] = [];
  if (!portfolio?.title?.trim() && !profile?.professionalTitle?.trim()) missingFields.push('professional title');
  if (!portfolio?.about?.trim()) missingFields.push('about section');
  if (!portfolio?.email?.trim()) missingFields.push('email');
  if (missingFields.length > 0) {
    gaps.push({ text: 'Incomplete professional profile', detail: `Missing: ${missingFields.join(', ')}` });
  }

  // No online presence
  if (!portfolio?.githubUrl?.trim() && !portfolio?.linkedinUrl?.trim() && !profile?.githubUrl?.trim() && !profile?.linkedinUrl?.trim()) {
    gaps.push({ text: 'No online presence links', detail: 'Add GitHub or LinkedIn to strengthen your profile' });
  }

  return gaps;
}


// ── Role Readiness (Stage 2) ───────────────────────────────

export interface RoleReadiness {
  percentage: number; // 0-100
  matchedSkills: string[];
  developingSkills: string[];
  missingSkills: string[];
  evidenceCoverage: number; // 0-100
}

/**
 * Deterministically calculates role readiness based on gap analysis.
 */
export function calculateRoleReadiness(
  gapAnalysis: CareerGapAnalysis,
): RoleReadiness | null {
  if (!gapAnalysis.targetRole) return null;

  const { requiredSkills, demonstratedSkills, gaps } = gapAnalysis;

  // Weight skills by importance
  const weights: Record<string, number> = { core: 10, important: 5, helpful: 2 };
  let totalWeight = 0;
  let earnedWeight = 0;

  const matchedSkills: string[] = [];
  const developingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requiredSkills) {
    const weight = weights[req.importance] || 1;
    totalWeight += weight;

    if (demonstratedSkills.includes(req.skill)) {
      matchedSkills.push(req.skill);
      earnedWeight += weight;
    } else {
      const gap = gaps.find((g) => g.skill === req.skill);
      if (gap && gap.status === 'weak_evidence') {
        developingSkills.push(req.skill);
        earnedWeight += weight * 0.5; // Partial credit for weak evidence
      } else {
        missingSkills.push(req.skill);
      }
    }
  }

  const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Evidence coverage: % of required skills that have some evidence
  const evidenceCoverage =
    requiredSkills.length > 0
      ? Math.round(((demonstratedSkills.length + developingSkills.length * 0.5) / requiredSkills.length) * 100)
      : 0;

  return {
    percentage,
    matchedSkills,
    developingSkills,
    missingSkills,
    evidenceCoverage,
  };
}

// ── Skill Evidence Visualization Score ───────────────────────

export interface SkillEvidenceScore {
  skill: string;
  score: number; // 0-100
  label: string; // 'Strong evidence' | 'Some evidence' | 'Limited evidence' | 'No evidence'
  sourceCount: number;
}

export function calculateSkillEvidenceScores(
  portfolio: Portfolio | null,
  evidence: CareerEvidence[],
): SkillEvidenceScore[] {
  if (!portfolio) return [];

  const scores: SkillEvidenceScore[] = [];

  for (const skill of portfolio.skills) {
    const items = evidence.filter((e) => e.skill.toLowerCase() === skill.toLowerCase());
    const sourceCount = items.length;
    const strongCount = items.filter((e) => e.evidenceStrength === 'strong').length;
    const moderateCount = items.filter((e) => e.evidenceStrength === 'moderate').length;

    let score: number;
    let label: string;

    if (sourceCount === 0) {
      score = 0;
      label = 'No evidence';
    } else if (strongCount >= 2) {
      score = 80 + Math.min(20, moderateCount * 5);
      label = 'Strong evidence';
    } else if (strongCount >= 1 || moderateCount >= 2) {
      score = 55 + Math.min(25, sourceCount * 5);
      label = 'Some evidence';
    } else {
      score = 20 + Math.min(30, sourceCount * 10);
      label = 'Limited evidence';
    }

    scores.push({ skill, score: Math.min(100, score), label, sourceCount });
  }

  return scores.sort((a, b) => b.score - a.score);
}
