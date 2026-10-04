import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminAuth } from '@/lib/firebase-admin';
import { GEMINI_MODEL, GEMINI_API_KEY } from '@/lib/gemini-config';
import { checkGeminiRateLimit } from '@/lib/rate-limit';



if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Gemini features will be unavailable.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

async function generateText(prompt: string) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()?.trim();
    
    if (text) {
      return text;
    }
    throw new Error('Empty response from Gemini.');
  } catch (error) {
    console.error(`Gemini error with model ${GEMINI_MODEL}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  // Verify user authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let decodedUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    decodedUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit
  const rateCheck = checkGeminiRateLimit(decodedUid);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const input = body.input && typeof body.input === 'object' ? body.input : {};

    if (!type) {
      return NextResponse.json({ error: 'Missing request type.' }, { status: 400 });
    }

    const VALID_TYPES = [
      'about', 'project', 'skills', 'experience', 'highlights', 'education',
      'projectTechStack', 'headline', 'careerRecommendations',
      'structuredCareerRecommendations', 'projectIdeas', 'projectBlueprint',
      'projectRoadmap', 'projectDocsPack', 'jobDescription',
    ];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Unknown request type: ${type}` }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    let prompt = '';

    switch (type) {
      case 'about': {
        const aboutInput = input as {
          name?: string;
          title?: string;
          experience?: string;
          existingAbout?: string;
          style?: string;
        };
        prompt = `Write a polished professional About Me section for a portfolio website.

Use ONLY the following details:
- Name: ${aboutInput.name ?? 'Anonymous'}
- Professional Field/Role: ${aboutInput.title ?? 'Professional'}
- Existing About text: ${aboutInput.existingAbout?.trim() || 'No existing text provided.'}
- Experience: ${aboutInput.experience ?? 'general experience'}
- Style: ${aboutInput.style ?? 'clear and confident'}

Write one polished paragraph that is 80-120 words long. It MUST be specifically relevant to the field: "${aboutInput.title ?? 'Professional'}".
Do NOT invent achievements, skills, or experience not mentioned in the provided details. 
Return only the paragraph text, no bullet points, no markdown.`;
        break;
      }
      case 'project': {
        const projectInput = input as {
          projectName?: string;
          summary?: string;
          techStack?: string[];
          audience?: string;
        };
        prompt = `Write a concise and compelling project description for a portfolio website.
Project name: ${projectInput.projectName ?? 'Project'}
Summary: ${projectInput.summary ?? 'A modern software project'}
Tech stack: ${projectInput.techStack?.join(', ') ?? 'various technologies'}
Audience: ${projectInput.audience ?? 'potential employers'}

Return only one polished paragraph, no bullets, no markdown.`;
        break;
      }
      case 'skills': {
        const skillsInput = input as {
          role?: string;
          domain?: string;
          existingSkills?: string[];
        };
        prompt = `Suggest 8 relevant professional skills for a portfolio.
Role: ${skillsInput.role ?? 'developer'}
Domain: ${skillsInput.domain ?? 'software development'}
Existing skills: ${skillsInput.existingSkills?.join(', ') ?? 'none'}

Return strictly as a JSON array of strings, no extra text.`;
        break;
      }
      case 'experience': {
        const expInput = input as {
          company?: string;
          role?: string;
          brief?: string;
        };
        prompt = `Write a professional experience description for a portfolio website, specifically for the field: "${expInput.role ?? 'Professional'}".
Company: ${expInput.company ?? 'a company'}
Role: ${expInput.role ?? 'a professional'}
Brief context: ${expInput.brief?.trim() || 'No additional context provided.'}

Write 2-3 sentences describing key responsibilities and impact in a confident, action-oriented style. 
Use ONLY the provided context. Do NOT invent responsibilities, achievements, or tech stacks not mentioned.
Return only the paragraph text, no bullets, no markdown.`;
        break;
      }
      case 'highlights': {
        const hlInput = input as {
          role?: string;
          company?: string;
          description?: string;
        };
        prompt = `Generate 3-5 professional achievement bullet points for a portfolio.
Role: ${hlInput.role ?? 'a professional'}
Company: ${hlInput.company ?? 'a company'}
Description: ${hlInput.description?.trim() || 'No description provided.'}

Each bullet should start with a strong action verb and be concise (one line each).
Return strictly as a JSON array of strings, no extra text.`;
        break;
      }
      case 'education': {
        const eduInput = input as {
          school?: string;
          degree?: string;
          field?: string;
        };
        prompt = `Write a brief education description for a portfolio website.
Institution: ${eduInput.school ?? 'a university'}
Degree: ${eduInput.degree ?? 'a degree'}
Field: ${eduInput.field ?? 'a field of study'}

Write 1-2 sentences about the academic focus, relevant coursework, or achievements. Return only the paragraph text, no bullets, no markdown.`;
        break;
      }
      case 'projectTechStack': {
        const tsInput = input as {
          projectName?: string;
          description?: string;
        };
        prompt = `Suggest 5-8 relevant technologies or tools for this project.
Project name: ${tsInput.projectName ?? 'a project'}
Description: ${tsInput.description?.trim() || 'No description provided.'}

Return strictly as a JSON array of strings, no extra text.`;
        break;
      }
      case 'headline': {
        const hlInput = input as {
          name?: string;
          about?: string;
          skills?: string[];
        };
        prompt = `Suggest a concise professional title or headline for a portfolio website.
Name: ${hlInput.name ?? 'a professional'}
About: ${hlInput.about?.trim() || 'No about text provided.'}
Skills: ${hlInput.skills?.join(', ') ?? 'various skills'}

The title should be 2-6 words, specific and impactful (e.g. "Full-Stack Developer", "UX Designer & Researcher").
Return only the title text, no quotes, no extra text.`;
        break;
      }
      case 'careerRecommendations': {
        const crInput = input as {
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
        };
        prompt = `You are a career advisor. Based on this real career data, provide 3-5 specific, actionable recommendations.

Career Readiness: ${crInput.readinessScore ?? 0}/100
- Skills Strength: ${crInput.skillsScore ?? 0}/100
- Experience Strength: ${crInput.experienceScore ?? 0}/100
- Project Strength: ${crInput.projectScore ?? 0}/100
- Evidence Strength: ${crInput.evidenceScore ?? 0}/100
- Profile Completeness: ${crInput.completenessScore ?? 0}/100

Strengths: ${crInput.strengths?.join('; ') || 'None identified'}
Gaps: ${crInput.gaps?.join('; ') || 'None identified'}
Skills: ${crInput.skills?.join(', ') || 'None listed'}
Experience entries: ${crInput.experienceCount ?? 0}
Projects: ${crInput.projectCount ?? 0}
Certifications: ${crInput.certificationCount ?? 0}
Skills without evidence: ${crInput.skillsWithoutEvidence?.join(', ') || 'None'}

Rules:
- Each recommendation must be based on the supplied data — do NOT invent experience, projects, skills, or metrics the user doesn't have
- Be specific: reference actual gaps and weaknesses from the data
- Focus on the highest-impact improvements first
- Keep each recommendation to one sentence
- Return strictly as a JSON array of strings, no extra text`;
        break;
      }
      case 'structuredCareerRecommendations': {
        const scrInput = input as {
          targetRole: string;
          demonstratedSkills: string[];
          skillsWithStrength: Array<{ skill: string; strength: string; confidence: number }>;
          careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
          projectCount: number;
          experienceCount: number;
        };
        const gapsText = scrInput.careerGaps.length > 0
          ? scrInput.careerGaps.map((g) => `  - ${g.skill} (${g.priority} priority, ${g.status}): ${g.missingEvidence}`).join('\n')
          : '  No career gaps identified.';
        const skillsText = scrInput.skillsWithStrength.length > 0
          ? scrInput.skillsWithStrength.map((s) => `  - ${s.skill}: ${s.strength} (${s.confidence}% confidence)`).join('\n')
          : '  No skills with evidence yet.';

        prompt = `You are a career advisor for a software developer. Generate 2-4 specific, actionable career recommendations based ONLY on the supplied data.

TARGET CAREER: ${scrInput.targetRole}

DEMONSTRATED SKILLS:
${scrInput.demonstratedSkills.length > 0 ? scrInput.demonstratedSkills.map((s) => `  - ${s}`).join('\n') : '  None demonstrated yet.'}

SKILLS WITH STRENGTH:
${skillsText}

CAREER GAPS:
${gapsText}

PORTFOLIO: ${scrInput.projectCount} project(s), ${scrInput.experienceCount} experience entry/entries

STRICT RULES:
- Use only the supplied career data. Do NOT invent user achievements, skills, projects, experience, certificates, or evidence.
- Each recommendation MUST address one or more of the career gaps listed above.
- Do NOT recommend technologies unrelated to the gaps.
- If a gap can be addressed by building a project, recommend type "build_project".
- If a gap needs more evidence for an existing skill, recommend type "create_evidence" or "strengthen_skill".
- Priority should match the gap priority (high gap → high recommendation).
- Keep recommendations specific, actionable, and concise.

Return strictly as a JSON array of objects with this exact structure (no extra text, no markdown):
[
  {
    "type": "build_project|strengthen_skill|create_evidence|improve_project|learning_task",
    "title": "Short title",
    "description": "1-2 sentence explanation",
    "relatedSkill": "skill from gaps",
    "relatedGap": "gap skill name",
    "reason": "Why this addresses the gap",
    "priority": "high|medium|low",
    "recommendedAction": "Specific action to take",
    "expectedOutcome": "What evidence or skill improvement will result",
    "skillsToDevelop": ["skill1", "skill2"],
    "evidenceToCreate": ["evidence type 1", "evidence type 2"]
  }
]`;
        break;
      }
      case 'projectIdeas': {
        const piInput = input as {
          targetRole: string;
          careerGaps: Array<{ skill: string; status: string; priority: string; missingEvidence: string }>;
          demonstratedSkills: string[];
          existingProjectCount: number;
          existingProjectNames: string[];
        };
        const gapsText = piInput.careerGaps.length > 0
          ? piInput.careerGaps.map((g) => `  - ${g.skill} (${g.priority} priority, ${g.status}): ${g.missingEvidence}`).join('\n')
          : '  No career gaps identified.';

        prompt = `You are a career advisor and project mentor for a software developer. Generate 1-3 practical project ideas that directly address the user's career gaps.

TARGET CAREER: ${piInput.targetRole}

DEMONSTRATED SKILLS:
${piInput.demonstratedSkills.length > 0 ? piInput.demonstratedSkills.map((s) => `  - ${s}`).join('\n') : '  None demonstrated yet.'}

CAREER GAPS (each project MUST address one of these):
${gapsText}

EXISTING PROJECTS: ${piInput.existingProjectCount} (${piInput.existingProjectNames.length > 0 ? piInput.existingProjectNames.join(', ') : 'none'})

STRICT RULES:
- Use only the supplied career data. Do NOT invent existing user achievements, projects, skills, experience, certificates, or evidence.
- Every project idea MUST directly address one of the career gaps listed above.
- Do NOT suggest projects unrelated to the gaps.
- "Evidence to create" describes evidence the user COULD create by completing the project — it must NOT be presented as already existing.
- Priority should match the gap priority (high gap → high priority project).
- Focus on practical, buildable projects — not vague learning goals.
- Do NOT generate architecture, database schema, implementation details, or development roadmap. Only high-level project requirements.

Return strictly as a JSON array of objects with this exact structure (no extra text, no markdown):
[
  {
    "title": "Project title",
    "shortDescription": "1-2 sentence description of what the project does",
    "problem": "What problem this project solves or what gap it fills",
    "whyThisProject": "Why this specific project addresses the user's gap",
    "relatedGap": "the gap skill name this project addresses",
    "priority": "high|medium|low",
    "skillsToDemonstrate": ["skill1", "skill2"],
    "evidenceToCreate": ["evidence type user can create by completing this project"],
    "requirements": ["requirement 1", "requirement 2"]
  }
]`;
        break;
      }
      case 'projectBlueprint': {
        const bpInput = input as {
          projectTitle: string;
          projectDescription: string;
          relatedGap: string;
          skillsToDemonstrate: string[];
          projectRequirements: string[];
          targetRole: string;
          demonstratedSkills: string[];
        };

        prompt = `You are a senior software architect and career mentor. Generate a detailed technical blueprint for the following project idea, which was selected to address a career gap.

PROJECT: ${bpInput.projectTitle}
DESCRIPTION: ${bpInput.projectDescription}
CAREER GAP: ${bpInput.relatedGap}
SKILLS THIS PROJECT SHOULD DEMONSTRATE: ${bpInput.skillsToDemonstrate.join(', ')}
PROJECT REQUIREMENTS: ${bpInput.projectRequirements.join(', ')}
TARGET CAREER: ${bpInput.targetRole}
USER'S DEMONSTRATED SKILLS: ${bpInput.demonstratedSkills.length > 0 ? bpInput.demonstratedSkills.join(', ') : 'None yet'}

STRICT RULES:
- Use only the supplied career data. Do NOT invent user achievements, projects, skills, experience, certificates, or evidence.
- The blueprint MUST be for the project described above. Do NOT generate a blueprint for a different project.
- Technologies should be realistic for the user's skill level and career goal. Prefer technologies related to the user's demonstrated skills or target career.
- Do NOT claim the user already knows a technology unless it is listed in their demonstrated skills.
- "Expected evidence" describes evidence the user COULD create by completing the project — it must NOT be presented as already existing.
- Keep the architecture simple and appropriate for a portfolio project. Do NOT invent microservices, Kubernetes, event buses, or other unnecessary infrastructure.
- Features should be realistic for a portfolio project — do not make the feature list unnecessarily huge.
- Database schema is conceptual only — it belongs to the recommended future project, NOT to any existing system.

Return strictly as a JSON object with this exact structure (no extra text, no markdown):
{
  "projectTitle": "${bpInput.projectTitle}",
  "projectDescription": "Brief description of the project",
  "relatedGap": "${bpInput.relatedGap}",
  "objective": "What this project will accomplish",
  "requirements": ["functional requirement 1", "functional requirement 2"],
  "features": [
    { "category": "Category name", "items": ["feature 1", "feature 2"] }
  ],
  "architecture": "Simple description of the architecture layers and flow",
  "databaseSchema": {
    "entities": [
      { "name": "EntityName", "fields": ["id", "field1", "field2"] }
    ],
    "relationships": [
      { "description": "Entity1 1 → many Entity2" }
    ]
  },
  "developmentTasks": ["1. Initialize project", "2. Configure environment", "3. Create database"],
  "technologies": [
    { "category": "Category", "items": ["Technology1", "Technology2"] }
  ],
  "expectedEvidence": ["evidence type the completed project can create"]
}`;
        break;
      }
      case 'projectRoadmap': {
        const rmInput = input as {
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
        };
        const featuresText = rmInput.features.length > 0
          ? rmInput.features.map((f) => `  ${f.category}: ${f.items.join(', ')}`).join('\n')
          : '  None specified.';
        const dbEntitiesText = rmInput.databaseSchema.entities.length > 0
          ? rmInput.databaseSchema.entities.map((e) => `  ${e.name}: ${e.fields.join(', ')}`).join('\n')
          : '  None specified.';
        const dbRelsText = rmInput.databaseSchema.relationships.length > 0
          ? rmInput.databaseSchema.relationships.map((r) => `  ${r.description}`).join('\n')
          : '  None specified.';
        const techText = rmInput.technologies.length > 0
          ? rmInput.technologies.map((t) => `  ${t.category}: ${t.items.join(', ')}`).join('\n')
          : '  None specified.';

        prompt = `You are a senior software architect and career mentor. Create an actionable development roadmap based ONLY on the supplied project blueprint. This is a plan for BUILDING the project, not a description of what the user has already done.

PROJECT: ${rmInput.projectTitle}
CAREER GAP: ${rmInput.relatedGap}
OBJECTIVE: ${rmInput.objective}

REQUIREMENTS:
${rmInput.requirements.map((r) => `  - ${r}`).join('\n')}

FEATURES:
${featuresText}

ARCHITECTURE: ${rmInput.architecture}

DATABASE SCHEMA:
${dbEntitiesText}
Relationships:
${dbRelsText}

TECHNOLOGIES:
${techText}

EXPECTED EVIDENCE:
${rmInput.expectedEvidence.map((e) => `  - ${e}`).join('\n')}

SKILLS TO DEMONSTRATE:
${rmInput.skillsToDemonstrate.map((s) => `  - ${s}`).join('\n')}

STRICT RULES:
- Create an actionable development roadmap based ONLY on the supplied project blueprint.
- Do NOT invent user achievements, projects, experience, certificates, or existing evidence.
- Design FUTURE development tasks only. This is a plan for BUILDING the project.
- Every task must contribute to the selected project. Do NOT add unrelated features.
- Use 4-8 phases based on project complexity. Do NOT force exactly 6 phases.
- Each phase must have 1-4 milestones. Each milestone must have 2-8 tasks.
- Tasks must be actionable and specific — not vague like "Build backend" or granular like "Open VS Code".
- Difficulty must be "Easy", "Medium", or "Hard".
- Every milestone must have a clear Definition of Done.
- "Evidence produced" describes evidence the user CAN create by completing the milestone — it must NOT be presented as already existing.
- Do NOT generate calendar dates or time estimates. Use Phase 1, Phase 2, etc.
- totalTasks must equal the actual number of tasks across all milestones.

Return strictly as a JSON object with this exact structure (no extra text, no markdown):
{
  "projectTitle": "${rmInput.projectTitle}",
  "relatedGap": "${rmInput.relatedGap}",
  "objective": "What this project will accomplish",
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase title",
      "description": "What this phase accomplishes",
      "order": 1,
      "milestones": [
        {
          "id": "milestone-1",
          "title": "Milestone title",
          "description": "What this milestone achieves",
          "tasks": [
            {
              "id": "task-1",
              "title": "Task title",
              "description": "What this task does",
              "order": 1,
              "difficulty": "Easy|Medium|Hard",
              "definitionOfDone": "Observable result when task is complete"
            }
          ],
          "skillsDemonstrated": ["skill1"],
          "evidenceProduced": ["evidence this milestone can create"],
          "definitionOfDone": "Observable result when milestone is complete"
        }
      ]
    }
  ],
  "totalTasks": 20,
  "expectedEvidence": ["evidence the completed project can create"]
}`;
        break;
      }
      case 'projectDocsPack': {
        const dpInput = input as {
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
        };
        const featuresText = dpInput.features.length > 0
          ? dpInput.features.map((f) => `  ${f.category}: ${f.items.join(', ')}`).join('\n')
          : '  None specified.';
        const dbEntitiesText = dpInput.databaseSchema.entities.length > 0
          ? dpInput.databaseSchema.entities.map((e) => `  ${e.name}: ${e.fields.join(', ')}`).join('\n')
          : '  None specified.';
        const techText = dpInput.technologies.length > 0
          ? dpInput.technologies.map((t) => `  ${t.category}: ${t.items.join(', ')}`).join('\n')
          : '  None specified.';

        prompt = `You are a senior software engineer and technical writer. Generate a professional GitHub and documentation pack for the supplied project. The documentation describes the FUTURE project the user plans to build — not what they have already done.

PROJECT: ${dpInput.projectTitle}
CAREER GAP: ${dpInput.relatedGap}
OBJECTIVE: ${dpInput.objective}

REQUIREMENTS:
${dpInput.requirements.map((r) => `  - ${r}`).join('\n')}

FEATURES:
${featuresText}

ARCHITECTURE: ${dpInput.architecture}

DATABASE SCHEMA:
${dbEntitiesText}

TECHNOLOGIES:
${techText}

EXPECTED EVIDENCE:
${dpInput.expectedEvidence.map((e) => `  - ${e}`).join('\n')}

SKILLS TO DEMONSTRATE:
${dpInput.skillsToDemonstrate.map((s) => `  - ${s}`).join('\n')}

DEVELOPMENT ROADMAP: ${dpInput.phaseCount} phases, ${dpInput.totalTasks} tasks

STRICT RULES:
- Generate a professional GitHub and documentation pack based ONLY on the supplied project information.
- Do NOT invent features, technologies, achievements, career experience, or evidence that are not in the supplied data.
- The documentation describes the future project the user plans to build — do NOT claim the user has already built it.
- Do NOT claim the user has demonstrated skills or has existing evidence.
- Repository structure must be realistic for the selected project type. Do NOT add unnecessary folders.
- README must be portfolio-ready and reflect only the features in the blueprint.
- Documentation files must be relevant to the project. Do not generate docs the project doesn't need.
- Setup instructions must be practical and technology-appropriate.
- Testing documentation describes what should be tested — do NOT generate actual test code.
- Deployment guide should be high-level and hosting-provider-agnostic unless the blueprint specifies one.
- Portfolio description must be concise and based on the actual blueprint.

Return strictly as a JSON object with this exact structure (no extra text, no markdown):
{
  "projectTitle": "${dpInput.projectTitle}",
  "repositoryName": "kebab-case-repo-name",
  "repositoryDescription": "One-line description for GitHub",
  "folderStructure": "project-name/\\n├── src/\\n│   ├── ...\\n├── tests/\\n├── .env.example\\n├── README.md\\n├── package.json\\n└── tsconfig.json",
  "readme": "Full README content with: title, description, problem, solution, features, technologies, architecture, setup, env vars, running locally, testing, deployment, future improvements",
  "documentation": ["architecture.md", "api.md", "database.md"],
  "setupInstructions": "Step-by-step setup instructions",
  "testingDocumentation": "What should be tested and how",
  "deploymentGuide": "High-level deployment steps",
  "portfolioDescription": "Concise portfolio-ready project description"
}`;
        break;
      }
      case 'jobDescription': {
        const jdInput = input as {
          jobDescriptionText: string;
          userSkills: string[];
          targetRole: string;
        };
        prompt = `You are a career advisor analyzing how well a job description matches a candidate's profile.

TARGET ROLE: ${jdInput.targetRole || 'Not specified'}

CANDIDATE'S SKILLS:
${jdInput.userSkills.length > 0 ? jdInput.userSkills.map((s) => `  - ${s}`).join('\n') : '  No skills listed.'}

JOB DESCRIPTION:
${jdInput.jobDescriptionText}

STRICT RULES:
- Use ONLY the supplied candidate skills. Do NOT invent skills the candidate doesn't have.
- matchPercentage: how well the candidate's existing skills cover the job requirements (0-100).
- matchedSkills: skills the candidate has that are clearly required in the job description.
- missingSkills: skills the job description requires that the candidate does NOT have.
- developingSkills: skills the candidate has partial overlap with (related but not an exact match).
- evidenceCoverage: how much of the candidate's skills have supporting evidence/projects (0-100). Estimate based on skill count — if no evidence data is available, use 50.
- recommendations: 3-5 specific, actionable next steps to close the gaps. Each recommendation must reference actual missing or developing skills.

Return strictly as a JSON object with this exact structure (no extra text, no markdown):
{
  "matchPercentage": 65,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "developingSkills": ["skill5"],
  "evidenceCoverage": 50,
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown Gemini request type.' }, { status: 400 });
    }

    const text = await generateText(prompt);

    if (type === 'skills' || type === 'highlights' || type === 'projectTechStack' || type === 'careerRecommendations' || type === 'structuredCareerRecommendations' || type === 'projectIdeas' || type === 'projectBlueprint' || type === 'projectRoadmap' || type === 'projectDocsPack' || type === 'jobDescription') {
      try {
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned) as string[] | unknown[];
        return NextResponse.json({ data: parsed });
      } catch (e) {
        console.error('Failed to parse skills JSON:', text);
        return NextResponse.json({ error: `Failed to generate ${type} in the correct format.` }, { status: 500 });
      }
    }

    return NextResponse.json({ data: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    return NextResponse.json({ error: `Gemini request failed: ${message}` }, { status: 500 });
  }
}
