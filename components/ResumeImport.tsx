'use client';

import { useState, useRef } from 'react';
import { extractResumeData, type ResumeExtraction } from '@/lib/gemini';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface ResumeImportProps {
  onApply: (data: ResumeExtraction) => void;
}

export function ResumeImport({ onApply }: ResumeImportProps) {
  const { user } = useAuth();
  const [state, setState] = useState<'idle' | 'loading' | 'review' | 'error'>('idle');
  const [extracted, setExtracted] = useState<ResumeExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      setState('error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      setState('error');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const result = await extractResumeData(file, await user?.getIdToken());

      if (result.data) {
        setExtracted(result.data);
        setState('review');
      } else {
        setError(result.error ?? 'Extraction failed. Please try again.');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed. Please try again.');
      setState('error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleApply() {
    if (extracted) {
      onApply(extracted);
      setExtracted(null);
      setState('idle');
    }
  }

  function handleCancel() {
    setExtracted(null);
    setError(null);
    setState('idle');
  }

  if (state === 'idle') {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-slate-400 hover:bg-slate-100">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="text-3xl">📄</div>
          <p className="mt-2 text-sm font-medium text-slate-700">Import from Resume</p>
          <p className="mt-1 text-xs text-slate-500">Upload a PDF resume to auto-fill your portfolio</p>
        </label>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-3 text-sm font-medium text-blue-700">Extracting data from your resume…</p>
        <p className="mt-1 text-xs text-blue-500">This may take a few seconds</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700">Extraction Failed</p>
        <p className="text-xs text-red-600">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!extracted) return null;

  return (
    <div className="space-y-4 rounded-xl border border-green-200 bg-green-50/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-green-800">✅ Resume Extracted — Review Below</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleApply}>
            Apply to Builder
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {hasPersonalData(extracted) && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Personal Info</h4>
          <div className="grid gap-1.5 text-sm sm:grid-cols-2">
            {extracted.name && <Field label="Name" value={extracted.name} />}
            {extracted.title && <Field label="Title" value={extracted.title} />}
            {extracted.email && <Field label="Email" value={extracted.email} />}
            {extracted.phone && <Field label="Phone" value={extracted.phone} />}
            {extracted.location && <Field label="Location" value={extracted.location} />}
            {extracted.websiteUrl && <Field label="Website" value={extracted.websiteUrl} />}
            {extracted.githubUrl && <Field label="GitHub" value={extracted.githubUrl} />}
            {extracted.linkedinUrl && <Field label="LinkedIn" value={extracted.linkedinUrl} />}
          </div>
        </div>
      )}

      {extracted.about && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">About</h4>
          <p className="text-sm leading-6 text-slate-700">{extracted.about}</p>
        </div>
      )}

      {extracted.skills.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Skills ({extracted.skills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {extracted.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {extracted.experience.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Experience ({extracted.experience.length})
          </h4>
          <div className="space-y-3">
            {extracted.experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-slate-300 pl-3">
                <p className="text-sm font-medium text-slate-800">
                  {exp.role}
                  {exp.company ? ` at ${exp.company}` : ''}
                </p>
                {(exp.startDate || exp.location) && (
                  <p className="text-xs text-slate-500">
                    {exp.startDate}
                    {exp.endDate ? ` — ${exp.endDate}` : ''} {exp.location && `· ${exp.location}`}
                  </p>
                )}
                {exp.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {extracted.education.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Education ({extracted.education.length})
          </h4>
          <div className="space-y-3">
            {extracted.education.map((ed, i) => (
              <div key={i} className="border-l-2 border-slate-300 pl-3">
                <p className="text-sm font-medium text-slate-800">
                  {ed.degree}
                  {ed.field ? ` in ${ed.field}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {ed.school}
                  {ed.startDate ? ` · ${ed.startDate}` : ''}
                  {ed.endDate ? ` — ${ed.endDate}` : ''}
                </p>
                {ed.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{ed.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {extracted.projects.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Projects ({extracted.projects.length})
          </h4>
          <div className="space-y-3">
            {extracted.projects.map((proj, i) => (
              <div key={i} className="border-l-2 border-slate-300 pl-3">
                <p className="text-sm font-medium text-slate-800">{proj.name}</p>
                {proj.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{proj.description}</p>
                )}
                {proj.techStack.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-green-200 pt-3">
        <p className="text-xs text-slate-500">Extracted data will fill empty fields in your builder.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Apply to Builder
          </Button>
        </div>
      </div>
    </div>
  );
}

function hasPersonalData(data: ResumeExtraction): boolean {
  return !!(
    data.name ||
    data.title ||
    data.email ||
    data.phone ||
    data.location ||
    data.websiteUrl ||
    data.githubUrl ||
    data.linkedinUrl
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-500">{label}:</span>{' '}
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
