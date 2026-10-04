// ── GitHub Integration (Phase 6.1) ──────────────────────────

export interface GitHubConnection {
  isConnected: boolean;
  username?: string;
  githubId?: string;
}

// ── Career Profile ────────────────────────────────────────────

export interface Certification {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  date?: string;
}

export interface CareerProfile {
  id: string;
  userId: string;
  isPublic: boolean;
  professionalTitle: string;
  careerSummary: string;
  careerInterests: string[];
  githubUrl: string;
  linkedinUrl: string;
  certifications: Certification[];
  achievements: Achievement[];
  languages: string[];
  targetRoles: string[];
  targetRole?: string;
  targetRoleType?: string;
  githubConnection?: GitHubConnection;
  createdAt: string;
  updatedAt: string;

  // Career intelligence (populated by analysis, optional until first analysis)
  overallReadiness?: number;
  profileCompleteness?: number;
  strengthsSummary?: string[];
  gapsSummary?: string[];
  skillSummary?: string;
  evidenceSummary?: string;
  lastAnalyzedAt?: string;
}

// ── Evidence ─────────────────────────────────────────────────

export type EvidenceSourceType = 'project' | 'experience' | 'education' | 'certificate' | 'portfolio' | 'github';

export interface CareerEvidence {
  id: string;
  userId: string;
  skill: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  sourceTitle: string;
  evidenceText: string;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  createdAt: string;
}

// ── Skill Intelligence ───────────────────────────────────────

export type SkillCategory = 'technical' | 'soft' | 'domain' | 'tool' | 'language' | 'other';

export type SkillStrengthLevel = 'emerging' | 'developing' | 'strong' | 'advanced';

/** Persistable skill model (for future Firestore use). */
export interface CareerSkill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  strengthLevel: SkillStrengthLevel;
  confidence: number;
  evidenceCount: number;
  evidenceIds: string[];
  sourceTypes: EvidenceSourceType[];
  updatedAt: string;
}

/** Computed skill intelligence — derived from portfolio + evidence, not persisted. */
export interface DerivedSkillIntelligence {
  name: string;
  category: SkillCategory;
  strengthLevel: SkillStrengthLevel;
  confidence: number;
  evidenceCount: number;
  evidenceIds: string[];
  sourceTypes: EvidenceSourceType[];
  explicitlyListed: boolean;
}

// ── Evidence Intelligence (Phase 8C) ────────────────────────

export interface EvidenceDetail {
  id: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  sourceTitle: string;
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface SkillEvidenceReport {
  skill: string;
  category: SkillCategory;
  strengthLevel: SkillStrengthLevel;
  confidence: number;
  explicitlyListed: boolean;
  evidenceCount: number;
  uniqueSourceCount: number;
  sourceTypes: EvidenceSourceType[];
  evidence: EvidenceDetail[];
}

// ── Career Gap ───────────────────────────────────────────────

export type GapPriority = 'high' | 'medium' | 'low';

export type EvidenceLevel = 'none' | 'weak' | 'moderate' | 'strong';

export type GapStatus = 'missing' | 'weak_evidence' | 'developing' | 'demonstrated';

/** Persistable gap model (for Firestore careerGaps collection). */
export interface CareerGapItem {
  id: string;
  userId: string;
  skill: string;
  reason: string;
  currentEvidenceLevel: EvidenceLevel;
  requiredEvidenceLevel: 'moderate' | 'strong';
  missingEvidenceDescription: string;
  priority: GapPriority;
  createdAt: string;
  updatedAt: string;
}

// ── Career Gap Intelligence (Phase 8D) ─────────────────────

export interface RoleSkillRequirement {
  skill: string;
  importance: 'core' | 'important' | 'helpful';
  description: string;
}

export interface RoleSkillProfile {
  role: string;
  skills: RoleSkillRequirement[];
}

export interface CareerGapDetail {
  skill: string;
  targetRole: string;
  status: GapStatus;
  currentEvidenceLevel: EvidenceLevel;
  requiredEvidenceLevel: 'moderate' | 'strong';
  missingEvidence: string;
  priority: GapPriority;
  relatedEvidenceIds: string[];
}

export interface CareerGapAnalysis {
  targetRole: string;
  requiredSkills: RoleSkillRequirement[];
  demonstratedSkills: string[];
  gaps: CareerGapDetail[];
}

// ── Career Recommendation ────────────────────────────────────

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed';

export type RecommendationType = 'build_project' | 'strengthen_skill' | 'create_evidence' | 'improve_project' | 'learning_task';

/** Persistable recommendation model (for Firestore). */
export interface CareerRecommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  relatedSkill?: string;
  reason: string;
  priority: RecommendationPriority;
  recommendedAction: string;
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
}

/** Structured AI-generated recommendation — Phase 8E (session-based, not persisted). */
export interface StructuredCareerRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  relatedSkill: string;
  relatedGap: string;
  reason: string;
  priority: RecommendationPriority;
  recommendedAction: string;
  expectedOutcome: string;
  skillsToDevelop: string[];
  evidenceToCreate: string[];
}

/** Input sent to Gemini for structured career recommendations. */
export interface StructuredRecommendationsInput {
  targetRole: string;
  demonstratedSkills: string[];
  skillsWithStrength: Array<{ skill: string; strength: string; confidence: number }>;
  careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
  projectCount: number;
  experienceCount: number;
}

// ── Career Project Idea (Phase 8F-1) ────────────────────────

export interface CareerProjectIdea {
  id: string;
  title: string;
  shortDescription: string;
  problem: string;
  whyThisProject: string;
  relatedGap: string;
  priority: RecommendationPriority;
  skillsToDemonstrate: string[];
  evidenceToCreate: string[];
  requirements: string[];
}

/** Input sent to Gemini for project idea generation. */
export interface ProjectIdeasInput {
  targetRole: string;
  careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
  demonstratedSkills: string[];
  existingProjectCount: number;
  existingProjectNames: string[];
}

// ── Career Project Blueprint (Phase 8F-2) ──────────────────

export interface BlueprintFeatureGroup {
  category: string;
  items: string[];
}

export interface BlueprintDatabaseEntity {
  name: string;
  fields: string[];
}

export interface BlueprintDatabaseRelation {
  description: string;
}

export interface BlueprintDatabaseSchema {
  entities: BlueprintDatabaseEntity[];
  relationships: BlueprintDatabaseRelation[];
}

export interface BlueprintTechnologyGroup {
  category: string;
  items: string[];
}

export interface CareerProjectBlueprint {
  projectTitle: string;
  projectDescription: string;
  relatedGap: string;
  objective: string;
  requirements: string[];
  features: BlueprintFeatureGroup[];
  architecture: string;
  databaseSchema: BlueprintDatabaseSchema;
  developmentTasks: string[];
  technologies: BlueprintTechnologyGroup[];
  expectedEvidence: string[];
}

/** Input sent to Gemini for blueprint generation. */
export interface BlueprintInput {
  projectTitle: string;
  projectDescription: string;
  relatedGap: string;
  skillsToDemonstrate: string[];
  projectRequirements: string[];
  targetRole: string;
  demonstratedSkills: string[];
}

// ── Career Development Roadmap (Phase 8F-3A) ──────────────

export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  order: number;
  difficulty: TaskDifficulty;
  definitionOfDone: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  tasks: RoadmapTask[];
  skillsDemonstrated: string[];
  evidenceProduced: string[];
  definitionOfDone: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  order: number;
  milestones: RoadmapMilestone[];
}

export interface CareerDevelopmentRoadmap {
  projectTitle: string;
  relatedGap: string;
  objective: string;
  phases: RoadmapPhase[];
  totalTasks: number;
  expectedEvidence: string[];
}

/** Input sent to Gemini for roadmap generation. */
export interface RoadmapInput {
  projectTitle: string;
  relatedGap: string;
  objective: string;
  requirements: string[];
  features: BlueprintFeatureGroup[];
  architecture: string;
  databaseSchema: BlueprintDatabaseSchema;
  technologies: BlueprintTechnologyGroup[];
  expectedEvidence: string[];
  skillsToDemonstrate: string[];
}

// ── Career Project Documentation Pack (Phase 8F-3B) ───────

export interface CareerProjectDocumentationPack {
  projectTitle: string;
  repositoryName: string;
  repositoryDescription: string;
  folderStructure: string;
  readme: string;
  documentation: string[];
  setupInstructions: string;
  testingDocumentation: string;
  deploymentGuide: string;
  portfolioDescription: string;
}

/** Input sent to Gemini for documentation pack generation. */
export interface DocsInput {
  projectTitle: string;
  relatedGap: string;
  objective: string;
  requirements: string[];
  features: BlueprintFeatureGroup[];
  architecture: string;
  databaseSchema: BlueprintDatabaseSchema;
  technologies: BlueprintTechnologyGroup[];
  expectedEvidence: string[];
  skillsToDemonstrate: string[];
  phaseCount: number;
  totalTasks: number;
}
