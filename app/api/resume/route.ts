import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminAuth } from '@/lib/firebase-admin';
import { GEMINI_MODEL, GEMINI_API_KEY } from '@/lib/gemini-config';
import { checkResumeRateLimit } from '@/lib/rate-limit';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Resume import will be unavailable.');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

if (ai) {
  console.log(`Resume extraction initialized: model=${GEMINI_MODEL}`);
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

async function callWithRetry(
  client: GoogleGenAI,
  model: string,
  base64: string,
  promptText: string,
) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType: 'application/pdf' } },
              { text: promptText },
            ],
          },
        ],
      });
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        'status' in err &&
        (err.status === 429 || err.status === 503);
      if (!isRetryable || attempt === MAX_RETRIES) throw err;
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
      console.warn(
        `Resume extraction: attempt ${attempt} failed (status ${(err as { status: number }).status}), retrying in ${delay}ms…`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

const SIZE_LIMIT_LABEL = '5 MB';

function sizeError(hint?: string) {
  const msg = hint
    ? `File is too large (${hint}). Maximum allowed size is ${SIZE_LIMIT_LABEL}.`
    : `File exceeds the maximum allowed size of ${SIZE_LIMIT_LABEL}.`;
  return NextResponse.json({ error: msg }, { status: 400 });
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
  const rateCheck = checkResumeRateLimit(decodedUid);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait before uploading another resume.' }, { status: 429 });
  }

  try {
    if (!ai) {
      return NextResponse.json(
        { error: 'Resume extraction is unavailable — API key not configured.' },
        { status: 500 },
      );
    }

    // Pre-check Content-Length before reading the body
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
      return sizeError(`${(Number(contentLength) / (1024 * 1024)).toFixed(1)} MB`);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formErr: unknown) {
      const msg = formErr instanceof Error ? formErr.message : String(formErr);
      const isSizeError =
        /body.*size|too large|413|payload.*exceed/i.test(msg) ||
        (formErr instanceof Error && 'status' in formErr && (formErr as { status: number }).status === 413);
      if (isSizeError) {
        return sizeError();
      }
      console.error('Resume extraction: failed to parse form data:', msg);
      return NextResponse.json(
        { error: 'Could not read the uploaded file. Please try again.' },
        { status: 400 },
      );
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return sizeError(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');

    const prompt = `You are an expert resume parser. Extract all structured information from this resume PDF.

Return ONLY a valid JSON object. Do not include any other text, markdown formatting, or code blocks.

Exact JSON structure:
{
  "name": "string",
  "title": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "websiteUrl": "string",
  "githubUrl": "string",
  "linkedinUrl": "string",
  "about": "string",
  "skills": ["string"],
  "projects": [{ "name": "string", "description": "string", "techStack": ["string"], "link": "string", "githubUrl": "string" }],
  "experience": [{ "company": "string", "role": "string", "location": "string", "startDate": "string", "endDate": "string", "description": "string" }],
  "education": [{ "school": "string", "degree": "string", "field": "string", "startDate": "string", "endDate": "string", "description": "string" }]
}

Rules:
- If a field is missing, use null for strings (or empty array [] for lists).
- About field: rewrite summary as a first-person portfolio bio (80-120 words).
- Experience description: 2-3 concise sentences, action-oriented.`;

    const response = await callWithRetry(ai, GEMINI_MODEL, base64Data, prompt);

    const text = response.text?.trim();

    if (!text) {
      console.error('Resume extraction: empty response from model', GEMINI_MODEL);
      return NextResponse.json(
        { error: 'The AI could not extract information from this PDF. The document might be empty, unreadable, or in an unsupported format.' },
        { status: 500 },
      );
    }

    let cleaned = text;
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('Resume extraction: JSON parse failed, model', GEMINI_MODEL, 'raw:', cleaned.slice(0, 200));
      return NextResponse.json(
        { error: 'The AI returned an unexpected response format. Please try again.' },
        { status: 500 },
      );
    }

    const normalized = {
      name: (extracted.name as string) || '',
      title: (extracted.title as string) || '',
      email: (extracted.email as string) || '',
      phone: (extracted.phone as string) || '',
      location: (extracted.location as string) || '',
      websiteUrl: (extracted.websiteUrl as string) || '',
      githubUrl: (extracted.githubUrl as string) || '',
      linkedinUrl: (extracted.linkedinUrl as string) || '',
      about: (extracted.about as string) || '',
      skills: Array.isArray(extracted.skills) ? extracted.skills : [],
      projects: Array.isArray(extracted.projects)
        ? extracted.projects.map((p: Record<string, unknown>) => ({
            name: (p.name as string) || '',
            description: (p.description as string) || '',
            techStack: Array.isArray(p.techStack) ? (p.techStack as string[]) : [],
            link: (p.link as string) || '',
            githubUrl: (p.githubUrl as string) || '',
          }))
        : [],
      experience: Array.isArray(extracted.experience)
        ? extracted.experience.map((e: Record<string, unknown>) => ({
            company: (e.company as string) || '',
            role: (e.role as string) || '',
            location: (e.location as string) || '',
            startDate: (e.startDate as string) || '',
            endDate: (e.endDate as string) || '',
            description: (e.description as string) || '',
          }))
        : [],
      education: Array.isArray(extracted.education)
        ? extracted.education.map((ed: Record<string, unknown>) => ({
            school: (ed.school as string) || '',
            degree: (ed.degree as string) || '',
            field: (ed.field as string) || '',
            startDate: (ed.startDate as string) || '',
            endDate: (ed.endDate as string) || '',
            description: (ed.description as string) || '',
          }))
        : [],
    };

    return NextResponse.json({ data: normalized });
  } catch (error) {
    const apiErrorMsg = error instanceof Error ? error.message : String(error);
    const apiStatus =
      error instanceof Error && 'status' in error ? (error as { status: number }).status : 0;

    // Rate-limit / availability errors (already retried)
    if (apiStatus === 429 || apiStatus === 503) {
      console.error('Resume extraction: service unavailable after retries:', apiErrorMsg);
      return NextResponse.json(
        { error: 'The AI service is temporarily busy. Please wait a moment and try again.' },
        { status: 503 },
      );
    }

    // API / model errors (400 INVALID_ARGUMENT and similar)
    if (apiStatus === 400 || /INVALID_ARGUMENT/i.test(apiErrorMsg)) {
      console.error('Resume extraction API error (status 400):', apiErrorMsg);

      // Distinguish common 400 causes by inspecting the message
      if (/not.*(found|exist|support)/i.test(apiErrorMsg) || /model/i.test(apiErrorMsg)) {
        return NextResponse.json(
          { error: 'The AI model encountered an error processing this PDF. Please try again later.' },
          { status: 500 },
        );
      }

      if (/too.*(large|big|long|many)/i.test(apiErrorMsg) || /exceeds/i.test(apiErrorMsg)) {
        return NextResponse.json(
          { error: `This PDF is too complex or large for the AI to process inline. Maximum allowed size is ${SIZE_LIMIT_LABEL}.` },
          { status: 500 },
        );
      }

      if (/image|scan|ocr/i.test(apiErrorMsg)) {
        return NextResponse.json(
          { error: 'The AI could not read this PDF. It may be a scanned image rather than a text-based document. Please try a text-based PDF.' },
          { status: 500 },
        );
      }

      // Generic 400 — do NOT claim it is a scanned PDF
      return NextResponse.json(
        { error: 'The AI service could not process this PDF. It may contain unsupported formatting, be password-protected, or have an incompatible structure. Please try a different PDF.' },
        { status: 500 },
      );
    }

    if (apiStatus === 403) {
      console.error('Resume extraction: API access denied:', apiErrorMsg);
      return NextResponse.json(
        { error: 'The AI service denied the request. Please check the API configuration or try again later.' },
        { status: 500 },
      );
    }

    console.error('Resume extraction error:', apiErrorMsg);
    return NextResponse.json(
      { error: 'Something went wrong while extracting your resume. Please try again.' },
      { status: 500 },
    );
  }
}
