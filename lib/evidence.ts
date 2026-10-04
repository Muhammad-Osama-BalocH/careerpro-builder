import type { Portfolio } from '@/types/portfolio';
import type { CareerEvidence, CareerProfile, EvidenceSourceType } from '@/types/career';

/**
 * Derives career evidence from existing portfolio data.
 * No AI — purely structural analysis of what's already in the portfolio.
 *
 * Evidence strength rules:
 * - strong:  skill is in the item's techStack AND the item has a description
 * - moderate: skill is in the item's techStack but no description, OR skill is mentioned in the description text
 * - weak: skill only appears in portfolio.skills (no project/experience/education connection)
 */

export function deriveEvidenceFromPortfolio(portfolio: Portfolio, userId: string): CareerEvidence[] {
  const evidence: CareerEvidence[] = [];
  const now = new Date().toISOString();
  const seen = new Set<string>(); // dedupe key: `${skill.toLowerCase()}-${sourceType}-${sourceId}`

  function addEvidence(
    skill: string,
    sourceType: EvidenceSourceType,
    sourceId: string,
    sourceTitle: string,
    evidenceText: string,
    strength: CareerEvidence['evidenceStrength'],
  ) {
    const key = `${skill.toLowerCase()}-${sourceType}-${sourceId}`;
    if (seen.has(key)) return;
    seen.add(key);

    evidence.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${evidence.length}`,
      userId,
      skill,
      sourceType,
      sourceId,
      sourceTitle,
      evidenceText,
      evidenceStrength: strength,
      createdAt: now,
    });
  }

  // --- Projects: match skills from techStack + description ---
  for (const project of portfolio.projects) {
    // Tech stack items are direct skill evidence
    for (const tech of project.techStack) {
      const hasDesc = Boolean(project.description?.trim());
      addEvidence(
        tech,
        'project',
        project.id,
        project.name,
        hasDesc
          ? `Used in project "${project.name}": ${project.description!.slice(0, 200)}`
          : `Listed in tech stack for project "${project.name}"`,
        hasDesc ? 'strong' : 'moderate',
      );
    }

    // Check if any portfolio-level skill appears in the project description
    if (project.description) {
      for (const skill of portfolio.skills) {
        const skillLower = skill.toLowerCase();
        // Skip if already captured via techStack
        if (project.techStack.some((t) => t.toLowerCase() === skillLower)) continue;
        if (project.description.toLowerCase().includes(skillLower)) {
          addEvidence(
            skill,
            'project',
            project.id,
            project.name,
            `Mentioned in project "${project.name}": ${project.description.slice(0, 200)}`,
            'moderate',
          );
        }
      }
    }
  }

  // --- Experience: match skills from description ---
  for (const exp of portfolio.experience) {
    const sourceTitle = exp.company ? `${exp.role} at ${exp.company}` : exp.role;
    if (exp.description) {
      for (const skill of portfolio.skills) {
        const skillLower = skill.toLowerCase();
        if (exp.description.toLowerCase().includes(skillLower)) {
          addEvidence(
            skill,
            'experience',
            exp.id,
            sourceTitle,
            `Demonstrated at ${sourceTitle}: ${exp.description.slice(0, 200)}`,
            'strong',
          );
        }
      }
    }
  }

  // --- Education: match skills from description or field ---
  for (const edu of portfolio.education) {
    const sourceTitle = edu.field ? `${edu.degree} in ${edu.field} — ${edu.school}` : `${edu.degree} — ${edu.school}`;
    const textToSearch = [edu.description, edu.field].filter(Boolean).join(' ').toLowerCase();

    if (textToSearch) {
      for (const skill of portfolio.skills) {
        const skillLower = skill.toLowerCase();
        if (textToSearch.includes(skillLower)) {
          addEvidence(
            skill,
            'education',
            edu.id,
            sourceTitle,
            edu.description
              ? `Studied at ${edu.school}: ${edu.description.slice(0, 200)}`
              : `Part of ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} at ${edu.school}`,
            'moderate',
          );
        }
      }
    }
  }

  // --- Portfolio-level skills with no source connection → weak evidence ---
  const skillsWithSources = new Set(evidence.map((e) => e.skill.toLowerCase()));
  for (const skill of portfolio.skills) {
    if (!skillsWithSources.has(skill.toLowerCase())) {
      addEvidence(
        skill,
        'portfolio',
        portfolio.id,
        portfolio.name || 'Portfolio',
        `Listed as a skill in portfolio`,
        'weak',
      );
    }
  }

  return evidence;
}

/**
 * Derives career evidence from certifications in a career profile.
 * Matches portfolio skills against certification names.
 * No AI — purely structural matching.
 *
 * Strength rules:
 * - moderate: certification name explicitly contains the skill name
 *   (a cert verifies knowledge but doesn't demonstrate hands-on project usage)
 */
export function deriveCertificationEvidence(
  portfolio: Portfolio,
  profile: CareerProfile,
  userId: string,
): CareerEvidence[] {
  if (!profile.certifications || profile.certifications.length === 0) return [];

  const evidence: CareerEvidence[] = [];
  const now = new Date().toISOString();
  const seen = new Set<string>();

  function addEvidence(
    skill: string,
    sourceId: string,
    sourceTitle: string,
    evidenceText: string,
    strength: CareerEvidence['evidenceStrength'],
  ) {
    const key = `${skill.toLowerCase()}-certificate-${sourceId}`;
    if (seen.has(key)) return;
    seen.add(key);
    evidence.push({
      id: `ev-cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${evidence.length}`,
      userId,
      skill,
      sourceType: 'certificate',
      sourceId,
      sourceTitle,
      evidenceText,
      evidenceStrength: strength,
      createdAt: now,
    });
  }

  for (const cert of profile.certifications) {
    if (!cert.name?.trim()) continue;
    const certNameLower = cert.name.toLowerCase();
    const issuerText = cert.issuer ? ` issued by ${cert.issuer}` : '';

    for (const skill of portfolio.skills) {
      if (certNameLower.includes(skill.toLowerCase())) {
        addEvidence(
          skill,
          cert.id,
          cert.name,
          `Certification "${cert.name}"${issuerText} demonstrates ${skill}`,
          'moderate',
        );
      }
    }
  }

  return evidence;
}

export interface GitHubRepository {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string | null;
  topics: string[];
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export function deriveGitHubEvidence(
  repos: GitHubRepository[],
  userId: string,
): CareerEvidence[] {
  const evidence: CareerEvidence[] = [];
  const now = new Date().toISOString();
  const seen = new Set<string>();

  function addEvidence(
    skill: string,
    repoId: string,
    repoName: string,
    repoUrl: string,
    evidenceText: string,
    strength: CareerEvidence['evidenceStrength'],
  ) {
    const key = `${skill.toLowerCase()}-github-${repoId}`;
    if (seen.has(key)) return;
    seen.add(key);

    evidence.push({
      id: `ev-gh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${evidence.length}`,
      userId,
      skill,
      sourceType: 'github',
      sourceId: repoId,
      sourceTitle: repoName,
      evidenceText,
      evidenceStrength: strength,
      createdAt: now,
    });
  }

  for (const repo of repos) {
    if (repo.isPrivate) continue; // Only count public repos as portfolio evidence

    // 1. Language is strong evidence
    if (repo.language) {
      addEvidence(
        repo.language,
        repo.id,
        repo.name,
        repo.url,
        `Main language in repository ${repo.name}`,
        'strong',
      );
    }

    // 2. Topics are moderate/strong evidence
    for (const topic of repo.topics) {
      addEvidence(
        topic,
        repo.id,
        repo.name,
        repo.url,
        `Topic listed in repository ${repo.name}`,
        'moderate',
      );
    }
  }

  return evidence;
}
