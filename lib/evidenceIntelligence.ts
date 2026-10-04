import type {
  CareerEvidence,
  DerivedSkillIntelligence,
  EvidenceDetail,
  SkillEvidenceReport,
} from '@/types/career';

/**
 * Evidence Intelligence — Phase 8C
 *
 * Answers: "Why does CareerProof believe this user has this skill?"
 *
 * Builds traceable evidence reports from 8B's skill intelligence.
 * Uses the already-deduplicated evidence IDs from deriveSkillIntelligence()
 * so that 8C never re-deduplicates or re-scores — it only enriches.
 *
 * Every evidence item in a report traces back to actual user data:
 *   skill → evidence → source → explanation
 */

/**
 * Build a traceable evidence report for a single skill.
 * Relies on 8B's deduped evidenceIds for consistency.
 */
export function buildSkillEvidenceReport(
  skillIntelligence: DerivedSkillIntelligence,
  allEvidence: CareerEvidence[],
): SkillEvidenceReport {
  const evidenceMap = new Map(allEvidence.map((e) => [e.id, e]));

  const details: EvidenceDetail[] = skillIntelligence.evidenceIds
    .map((id) => evidenceMap.get(id))
    .filter((e): e is CareerEvidence => e != null)
    .map((e) => ({
      id: e.id,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      sourceTitle: e.sourceTitle,
      description: e.evidenceText,
      strength: e.evidenceStrength,
    }));

  const uniqueSourceKeys = new Set(details.map((d) => `${d.sourceType}-${d.sourceId}`));

  return {
    skill: skillIntelligence.name,
    category: skillIntelligence.category,
    strengthLevel: skillIntelligence.strengthLevel,
    confidence: skillIntelligence.confidence,
    explicitlyListed: skillIntelligence.explicitlyListed,
    evidenceCount: details.length,
    uniqueSourceCount: uniqueSourceKeys.size,
    sourceTypes: skillIntelligence.sourceTypes,
    evidence: details,
  };
}

/**
 * Build traceable evidence reports for all skills.
 */
export function buildAllEvidenceReports(
  skillIntelligence: DerivedSkillIntelligence[],
  allEvidence: CareerEvidence[],
): SkillEvidenceReport[] {
  return skillIntelligence.map((si) => buildSkillEvidenceReport(si, allEvidence));
}

/**
 * Find a skill's evidence report by name (case-insensitive).
 * Returns null if the skill has no report (not in user data).
 */
export function findSkillEvidenceReport(
  reports: SkillEvidenceReport[],
  skillName: string,
): SkillEvidenceReport | null {
  const lower = skillName.toLowerCase();
  return reports.find((r) => r.skill.toLowerCase() === lower) ?? null;
}

/**
 * Count evidence by source type for a report.
 */
export function countEvidenceBySourceType(
  report: SkillEvidenceReport,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of report.evidence) {
    counts[e.sourceType] = (counts[e.sourceType] ?? 0) + 1;
  }
  return counts;
}

/**
 * Validate that every evidence detail in a report is traceable.
 * Returns true if every evidence item has a valid sourceType, sourceId, and description.
 */
export function isReportTraceable(report: SkillEvidenceReport): boolean {
  return report.evidence.every(
    (e) =>
      e.sourceType.length > 0 &&
      e.sourceId.length > 0 &&
      e.sourceTitle.length > 0 &&
      e.description.length > 0,
  );
}
