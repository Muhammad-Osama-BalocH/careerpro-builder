export type GeminiResponse<T> = {
  data?: T;
  error?: string;
};

async function callGeminiRoute<T>(type: 'about' | 'project' | 'skills' | 'experience' | 'highlights' | 'education' | 'projectTechStack' | 'headline' | 'careerRecommendations' | 'structuredCareerRecommendations' | 'projectIdeas' | 'projectBlueprint' | 'projectRoadmap' | 'projectDocsPack' | 'jobDescription', input: unknown, idToken?: string): Promise<GeminiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, input }),
    });

    const payload = (await response.json()) as GeminiResponse<T> & { error?: string };

    if (!response.ok) {
      return { error: payload.error ?? 'Gemini request failed.' };
    }

    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    return { error: `Gemini request failed: ${message}` };
  }
}

export async function generateAboutMe(input: {
  name?: string;
  title?: string;
  experience?: string;
  existingAbout?: string;
  style?: string;
}, idToken?: string): Promise<GeminiResponse<string>> {
  return callGeminiRoute<string>('about', input, idToken);
}

export async function generateProjectDescription(input: {
  projectName?: string;
  summary?: string;
  techStack?: string[];
  audience?: string;
}, idToken?: string): Promise<GeminiResponse<string>> {
  return callGeminiRoute<string>('project', input, idToken);
}

export async function generateSkillsSuggestions(input: {
  role?: string;
  domain?: string;
  existingSkills?: string[];
}, idToken?: string): Promise<GeminiResponse<string[]>> {
  return callGeminiRoute<string[]>('skills', input, idToken);
}

export async function generateExperienceDescription(input: {
  company?: string;
  role?: string;
  brief?: string;
}, idToken?: string): Promise<GeminiResponse<string>> {
  return callGeminiRoute<string>('experience', input, idToken);
}

export async function generateHighlights(input: {
  role?: string;
  company?: string;
  description?: string;
}, idToken?: string): Promise<GeminiResponse<string[]>> {
  return callGeminiRoute<string[]>('highlights', input, idToken);
}

export async function generateEducationDescription(input: {
  school?: string;
  degree?: string;
  field?: string;
}, idToken?: string): Promise<GeminiResponse<string>> {
  return callGeminiRoute<string>('education', input, idToken);
}

export async function suggestProjectTechStack(input: {
  projectName?: string;
  description?: string;
}, idToken?: string): Promise<GeminiResponse<string[]>> {
  return callGeminiRoute<string[]>('projectTechStack', input, idToken);
}

export async function suggestHeadline(input: {
  name?: string;
  about?: string;
  skills?: string[];
}, idToken?: string): Promise<GeminiResponse<string>> {
  return callGeminiRoute<string>('headline', input, idToken);
}

export interface CareerRecommendationsInput {
  readinessScore?: number;
  skillsScore?: number;
  experienceScore?: number;
  projectScore?: number;
  evidenceScore?: number;
  completenessScore?: number;
  strengths?: string[];
  gaps?: string[];
  skills?: string[];
  experienceCount?: number;
  projectCount?: number;
  certificationCount?: number;
  skillsWithoutEvidence?: string[];
}

export async function generateCareerRecommendations(input: CareerRecommendationsInput, idToken?: string): Promise<GeminiResponse<string[]>> {
  return callGeminiRoute<string[]>('careerRecommendations', input, idToken);
}

export interface StructuredCareerRecommendationsInput {
  targetRole: string;
  demonstratedSkills: string[];
  skillsWithStrength: Array<{ skill: string; strength: string; confidence: number }>;
  careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
  projectCount: number;
  experienceCount: number;
}

export async function generateStructuredCareerRecommendations(
  input: StructuredCareerRecommendationsInput,
  idToken?: string,
): Promise<GeminiResponse<unknown[]>> {
  return callGeminiRoute<unknown[]>('structuredCareerRecommendations', input, idToken);
}

export interface ProjectIdeasGeminiInput {
  targetRole: string;
  careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
  demonstratedSkills: string[];
  existingProjectCount: number;
  existingProjectNames: string[];
}

export async function generateProjectIdeas(
  input: ProjectIdeasGeminiInput,
  idToken?: string,
): Promise<GeminiResponse<unknown[]>> {
  return callGeminiRoute<unknown[]>('projectIdeas', input, idToken);
}

export interface BlueprintGeminiInput {
  projectTitle: string;
  projectDescription: string;
  relatedGap: string;
  skillsToDemonstrate: string[];
  projectRequirements: string[];
  targetRole: string;
  demonstratedSkills: string[];
}

export async function generateBlueprint(
  input: BlueprintGeminiInput,
  idToken?: string,
): Promise<GeminiResponse<unknown>> {
  return callGeminiRoute<unknown>('projectBlueprint', input, idToken);
}

export interface RoadmapGeminiInput {
  projectTitle: string;
  relatedGap: string;
  objective: string;
  requirements: string[];
  features: Array<{ category: string; items: string[] }>;
  architecture: string;
  databaseSchema: { entities: Array<{ name: string; fields: string[] }>; relationships: Array<{ description: string }> };
  technologies: Array<{ category: string; items: string[] }>;
  expectedEvidence: string[];
  skillsToDemonstrate: string[];
}

export async function generateRoadmap(
  input: RoadmapGeminiInput,
  idToken?: string,
): Promise<GeminiResponse<unknown>> {
  return callGeminiRoute<unknown>('projectRoadmap', input, idToken);
}

export interface DocsPackGeminiInput {
  projectTitle: string;
  relatedGap: string;
  objective: string;
  requirements: string[];
  features: Array<{ category: string; items: string[] }>;
  architecture: string;
  databaseSchema: { entities: Array<{ name: string; fields: string[] }>; relationships: Array<{ description: string }> };
  technologies: Array<{ category: string; items: string[] }>;
  expectedEvidence: string[];
  skillsToDemonstrate: string[];
  phaseCount: number;
  totalTasks: number;
}

export async function generateDocsPack(
  input: DocsPackGeminiInput,
  idToken?: string,
): Promise<GeminiResponse<unknown>> {
  return callGeminiRoute<unknown>('projectDocsPack', input, idToken);
}

export interface ResumeExtraction {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  websiteUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  about: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    techStack: string[];
    link: string;
    githubUrl: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
}


export interface JobDescriptionInput {
  jobDescriptionText: string;
  userSkills: string[];
  targetRole: string;
}

export interface JobDescriptionAnalysis {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  developingSkills: string[];
  evidenceCoverage: number;
  recommendations: string[];
}

export async function analyzeJobDescription(input: JobDescriptionInput, idToken?: string): Promise<GeminiResponse<JobDescriptionAnalysis>> {
  return callGeminiRoute<JobDescriptionAnalysis>('jobDescription', input, idToken);
}

export async function extractResumeData(file: File, idToken?: string): Promise<GeminiResponse<ResumeExtraction>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch('/api/resume', {
      method: 'POST',
      headers,
      body: formData,
    });

    let payload: GeminiResponse<ResumeExtraction> & { error?: string };
    try {
      payload = (await response.json()) as GeminiResponse<ResumeExtraction> & { error?: string };
    } catch {
      // Server returned non-JSON (e.g. 413 body-too-large from framework)
      if (response.status === 413) {
        return { error: 'File exceeds the maximum allowed size of 5 MB.' };
      }
      return { error: 'Resume extraction failed. Please try again.' };
    }

    if (!response.ok) {
      return { error: payload.error ?? 'Resume extraction failed.' };
    }

    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Resume extraction failed: ${message}` };
  }
}
