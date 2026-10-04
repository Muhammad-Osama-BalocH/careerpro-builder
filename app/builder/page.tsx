'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { PageTransition, SectionReveal, PressScale, fadeInUp, StatusBanner, ContentReveal, AnimatePresence } from '@/lib/motion';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Preview } from '@/components/Preview';
import { generateAboutMe, generateProjectDescription, generateSkillsSuggestions, generateExperienceDescription, generateHighlights, generateEducationDescription, suggestProjectTechStack, suggestHeadline, type ResumeExtraction } from '@/lib/gemini';
import { CANONICAL_TEMPLATES } from '@/components/templates/registry';
import { ResumeImport } from '@/components/ResumeImport';
import type { Portfolio, Project, Experience, Education } from '@/types/portfolio';

type TabKey = 'personal' | 'about' | 'skills' | 'projects' | 'experience' | 'education';

const templateOptions = CANONICAL_TEMPLATES.map((t) => ({ value: t.key, label: t.label }));

const tabs: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'about', label: 'About' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
];

function emptyProject(): Project {
  return { id: `p-${Date.now()}`, name: '', description: '', techStack: [], link: '', githubUrl: '', imageUrl: '', featured: false };
}

function emptyExperience(): Experience {
  return { id: `e-${Date.now()}`, company: '', role: '', location: '', startDate: '', endDate: '', current: false, description: '' };
}

function emptyEducation(): Education {
  return { id: `ed-${Date.now()}`, school: '', degree: '', field: '', startDate: '', endDate: '', description: '' };
}

const initialPortfolio = (): Portfolio => ({
  id: 'draft', name: '', title: '', about: '', email: '', phone: '', location: '',
  avatarUrl: '', linkedinUrl: '', githubUrl: '', websiteUrl: '', skills: [],
  projects: [], experience: [], education: [], template: 'minimal', isPublic: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

export default function BuilderPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio());
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingAbout, setIsGeneratingAbout] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isGeneratingExp, setIsGeneratingExp] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);
  const [isGeneratingEdu, setIsGeneratingEdu] = useState(false);
  const [eduError, setEduError] = useState<string | null>(null);
  const [isGeneratingTechStack, setIsGeneratingTechStack] = useState(false);
  const [techStackError, setTechStackError] = useState<string | null>(null);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
  const [headlineError, setHeadlineError] = useState<string | null>(null);
  const [savedPortfolios, setSavedPortfolios] = useState<Portfolio[]>([]);

  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  type AiSuggestion = { fieldKey: string; original: string | string[]; suggestion: string | string[]; regenerate: () => void };
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);

  function acceptSuggestion() {
    if (!aiSuggestion) return;
    const { fieldKey, suggestion } = aiSuggestion;
    if (fieldKey === 'title') updateField('title', suggestion as string);
    else if (fieldKey === 'about') updateField('about', suggestion as string);
    else if (fieldKey === 'skills') updateField('skills', suggestion as string[]);
    else if (fieldKey.startsWith('project-desc-')) { const idx = Number(fieldKey.split('-').pop()); updateProject(idx, { description: suggestion as string }); }
    else if (fieldKey.startsWith('project-tech-')) { const idx = Number(fieldKey.split('-').pop()); updateProject(idx, { techStack: suggestion as string[] }); }
    else if (fieldKey.startsWith('exp-desc-')) { const idx = Number(fieldKey.split('-').pop()); updateExperience(idx, { description: suggestion as string }); }
    else if (fieldKey.startsWith('exp-highlights-')) { const idx = Number(fieldKey.split('-').pop()); updateExperience(idx, { highlights: suggestion as string[] }); }
    else if (fieldKey.startsWith('edu-desc-')) { const idx = Number(fieldKey.split('-').pop()); updateEducation(idx, { description: suggestion as string }); }
    setAiSuggestion(null);
  }

  async function handleGenerateHighlights(index: number) {
    setIsGeneratingHighlights(true); setHighlightsError(null);
    try {
      const exp = portfolio.experience[index]; const idToken = await user?.getIdToken();
      const r = await generateHighlights({ company: exp?.company, role: exp?.role, description: exp?.description }, idToken);
      if (r.data && exp) setAiSuggestion({ fieldKey: `exp-highlights-${index}`, original: exp.highlights ?? [], suggestion: r.data, regenerate: () => handleGenerateHighlights(index) });
      else if (r.error) setHighlightsError(r.error);
    } catch (err) { setHighlightsError(err instanceof Error ? err.message : 'Unable to generate highlights.'); }
    finally { setIsGeneratingHighlights(false); }
  }
  function cancelSuggestion() { setAiSuggestion(null); }
  function regenerateSuggestion() { if (!aiSuggestion) return; const fn = aiSuggestion.regenerate; setAiSuggestion(null); fn(); }

  useEffect(() => {
    if (!db || !isFirebaseConfigured || !user) return;
    const q = query(collection(db, 'portfolios'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => { setSavedPortfolios(snap.docs.map((d) => ({ ...(d.data() as Portfolio), id: d.id }))); }, (err) => console.error('Firestore listener error:', err));
    return () => unsub();
  }, [user]);

  const previewData = useMemo(() => ({ ...portfolio }), [portfolio]);

  function updateField<K extends keyof Portfolio>(field: K, value: Portfolio[K]) { setPortfolio((c) => ({ ...c, [field]: value })); }

  function handleLoadPortfolio(item: Portfolio) { setPortfolio({ ...item }); setSavedId(item.id === 'draft' ? null : item.id); setSaveError(null); setSaveSuccess(false); }
  function handleNewPortfolio() { setPortfolio(initialPortfolio()); setSavedId(null); setSaveError(null); setSaveSuccess(false); }

  function handleApplyResume(data: ResumeExtraction) {
    setPortfolio((c) => {
      const merged = { ...c };
      if (!merged.name && data.name) merged.name = data.name;
      if (!merged.title && data.title) merged.title = data.title;
      if (!merged.email && data.email) merged.email = data.email;
      if (!merged.phone && data.phone) merged.phone = data.phone;
      if (!merged.location && data.location) merged.location = data.location;
      if (!merged.about && data.about) merged.about = data.about;
      if (!merged.websiteUrl && data.websiteUrl) merged.websiteUrl = data.websiteUrl;
      if (!merged.githubUrl && data.githubUrl) merged.githubUrl = data.githubUrl;
      if (!merged.linkedinUrl && data.linkedinUrl) merged.linkedinUrl = data.linkedinUrl;
      const existingSkills = new Set(merged.skills.map((s) => s.toLowerCase()));
      merged.skills = [...merged.skills, ...data.skills.filter((s) => !existingSkills.has(s.toLowerCase()))];
      merged.projects = [...merged.projects, ...data.projects.map((p) => ({ id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: p.name, description: p.description, techStack: p.techStack, link: p.link, githubUrl: p.githubUrl, imageUrl: '', featured: false }))];
      merged.experience = [...merged.experience, ...data.experience.map((e) => ({ id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, company: e.company, role: e.role, location: e.location, startDate: e.startDate, endDate: e.endDate, current: !e.endDate, description: e.description }))];
      merged.education = [...merged.education, ...data.education.map((ed) => ({ id: `ed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, school: ed.school, degree: ed.degree, field: ed.field, startDate: ed.startDate, endDate: ed.endDate, description: ed.description }))];
      return merged;
    });
  }

  function updateProject(index: number, patch: Partial<Project>) { setPortfolio((c) => ({ ...c, projects: c.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)) })); }
  function addProject() { setPortfolio((c) => ({ ...c, projects: [...c.projects, emptyProject()] })); }
  function removeProject(index: number) { setPortfolio((c) => ({ ...c, projects: c.projects.filter((_, i) => i !== index) })); }

  function updateExperience(index: number, patch: Partial<Experience>) { setPortfolio((c) => ({ ...c, experience: c.experience.map((e, i) => (i === index ? { ...e, ...patch } : e)) })); }
  function addExperience() { setPortfolio((c) => ({ ...c, experience: [...c.experience, emptyExperience()] })); }
  function removeExperience(index: number) { setPortfolio((c) => ({ ...c, experience: c.experience.filter((_, i) => i !== index) })); }

  function updateEducation(index: number, patch: Partial<Education>) { setPortfolio((c) => ({ ...c, education: c.education.map((e, i) => (i === index ? { ...e, ...patch } : e)) })); }
  function addEducation() { setPortfolio((c) => ({ ...c, education: [...c.education, emptyEducation()] })); }
  function removeEducation(index: number) { setPortfolio((c) => ({ ...c, education: c.education.filter((_, i) => i !== index) })); }

  async function handleGenerateAbout() {
    setIsGeneratingAbout(true); setAboutError(null);
    try { const idToken = await user?.getIdToken(); const r = await generateAboutMe({ name: portfolio.name, title: portfolio.title, experience: portfolio.experience?.map((e) => `${e.role} at ${e.company}`).join(', '), existingAbout: portfolio.about, style: 'clear and confident' }, idToken); if (r.data) setAiSuggestion({ fieldKey: 'about', original: portfolio.about, suggestion: r.data, regenerate: handleGenerateAbout }); else if (r.error) setAboutError(r.error); } catch (err) { setAboutError(err instanceof Error ? err.message : 'Unable to generate.'); } finally { setIsGeneratingAbout(false); }
  }
  async function handleGenerateSkills() {
    setIsGeneratingSkills(true); setSkillsError(null);
    try {
      const idToken = await user?.getIdToken();
      const r = await generateSkillsSuggestions({ role: portfolio.title, domain: portfolio.title || 'software development', existingSkills: portfolio.skills }, idToken);
      if (r.data) setAiSuggestion({ fieldKey: 'skills', original: portfolio.skills, suggestion: r.data, regenerate: handleGenerateSkills });
      else if (r.error) setSkillsError(r.error);
    } catch (err) { setSkillsError(err instanceof Error ? err.message : 'Unable to generate skills.'); }
    finally { setIsGeneratingSkills(false); }
  }
  async function handleGenerateProjectDescription(index: number) {
    setIsGeneratingProject(true); setProjectError(null);
    try {
      const project = portfolio.projects[index]; const idToken = await user?.getIdToken();
      const r = await generateProjectDescription({ projectName: project?.name, summary: project?.description, techStack: project?.techStack, audience: 'potential employers' }, idToken);
      if (r.data && project) setAiSuggestion({ fieldKey: `project-desc-${index}`, original: project.description, suggestion: r.data, regenerate: () => handleGenerateProjectDescription(index) });
      else if (r.error) setProjectError(r.error);
    } catch (err) { setProjectError(err instanceof Error ? err.message : 'Unable to generate description.'); }
    finally { setIsGeneratingProject(false); }
  }
  async function handleGenerateExperienceDescription(index: number) {
    setIsGeneratingExp(true); setExpError(null);
    try {
      const exp = portfolio.experience[index]; const idToken = await user?.getIdToken();
      const r = await generateExperienceDescription({ company: exp?.company, role: exp?.role, brief: exp?.description }, idToken);
      if (r.data && exp) setAiSuggestion({ fieldKey: `exp-desc-${index}`, original: exp.description, suggestion: r.data, regenerate: () => handleGenerateExperienceDescription(index) });
      else if (r.error) setExpError(r.error);
    } catch (err) { setExpError(err instanceof Error ? err.message : 'Unable to generate description.'); }
    finally { setIsGeneratingExp(false); }
  }
  async function handleGenerateEducationDescription(index: number) {
    setIsGeneratingEdu(true); setEduError(null);
    try {
      const edu = portfolio.education[index]; const idToken = await user?.getIdToken();
      const r = await generateEducationDescription({ school: edu?.school, degree: edu?.degree, field: edu?.field }, idToken);
      if (r.data && edu) setAiSuggestion({ fieldKey: `edu-desc-${index}`, original: edu.description ?? '', suggestion: r.data, regenerate: () => handleGenerateEducationDescription(index) });
      else if (r.error) setEduError(r.error);
    } catch (err) { setEduError(err instanceof Error ? err.message : 'Unable to generate description.'); }
    finally { setIsGeneratingEdu(false); }
  }
  async function handleSuggestTechStack(index: number) {
    setIsGeneratingTechStack(true); setTechStackError(null);
    try {
      const project = portfolio.projects[index]; const idToken = await user?.getIdToken();
      const r = await suggestProjectTechStack({ projectName: project?.name, description: project?.description }, idToken);
      if (r.data && project) setAiSuggestion({ fieldKey: `project-tech-${index}`, original: project.techStack, suggestion: r.data, regenerate: () => handleSuggestTechStack(index) });
      else if (r.error) setTechStackError(r.error);
    } catch (err) { setTechStackError(err instanceof Error ? err.message : 'Unable to suggest tech stack.'); }
    finally { setIsGeneratingTechStack(false); }
  }
  async function handleSuggestHeadline() {
    setIsGeneratingHeadline(true); setHeadlineError(null);
    try {
      const idToken = await user?.getIdToken();
      const r = await suggestHeadline({ name: portfolio.name, about: portfolio.about, skills: portfolio.skills }, idToken);
      if (r.data) setAiSuggestion({ fieldKey: 'title', original: portfolio.title, suggestion: r.data, regenerate: handleSuggestHeadline });
      else if (r.error) setHeadlineError(r.error);
    } catch (err) { setHeadlineError(err instanceof Error ? err.message : 'Unable to suggest headline.'); }
    finally { setIsGeneratingHeadline(false); }
  }

  async function handleSave() {
    if (!db || !isFirebaseConfigured) { setSaveError('Firebase is not configured.'); return; }
    if (!user) { setSaveError('You must be signed in to save.'); return; }
    setIsSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const now = new Date().toISOString(); const { id: _id, ...rest } = portfolio;
      const payload = { ...rest, userId: user.uid, updatedAt: now, ...(savedId ? {} : { createdAt: now }) };
      if (savedId) { await updateDoc(doc(db, 'portfolios', savedId), payload); }
      else { const docRef = await addDoc(collection(db, 'portfolios'), { ...payload, createdAt: now }); setSavedId(docRef.id); }
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to save.'); }
    finally { setIsSaving(false); }
  }

  return (
    <PageTransition className="space-y-6 overflow-x-hidden">
      {/* ═══ HEADER ═══ */}
      <SectionReveal>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Portfolio</p>
              <h1 className="mt-0.5 text-xl font-bold text-slate-900">Build your portfolio</h1>
              <p className="mt-0.5 text-xs text-slate-500">Edit content on the left, see it live on the right.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateField('isPublic', !portfolio.isPublic)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  portfolio.isPublic
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${portfolio.isPublic ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {portfolio.isPublic ? 'Public' : 'Private'}
              </button>
              <PressScale>
                <Button onClick={() => { void handleSave(); }} disabled={isSaving} size="sm">
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </PressScale>
            </div>
          </div>

          {/* Template selector */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Template</p>
            <div className="flex flex-wrap gap-1.5">
              {templateOptions.map((option) => {
                const isActive = portfolio.template === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('template', option.value as Portfolio['template'])}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portfolio selector */}
          {savedPortfolios.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-medium text-slate-500">Load:</span>
              {savedPortfolios.map((item) => (
                <button key={item.id} type="button" onClick={() => handleLoadPortfolio(item)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition ${savedId === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >{item.name || 'Untitled'}</button>
              ))}
              <button type="button" onClick={handleNewPortfolio}
                className={`rounded-lg border px-2.5 py-1 text-xs transition ${!savedId ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >+ New</button>
            </div>
          )}
        </div>
      </SectionReveal>

      {/* Status banners */}
      <StatusBanner visible={!!saveError}>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>
      </StatusBanner>
      <StatusBanner visible={saveSuccess}>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Portfolio saved.{savedId && portfolio.isPublic && <> <a href={`/portfolio/${savedId}`} target="_blank" rel="noreferrer" className="font-medium underline">View portfolio</a></>}{savedId && !portfolio.isPublic && <span className="ml-1 text-slate-500">(Private — not publicly visible)</span>}
        </div>
      </StatusBanner>

      {/* ═══ EDITOR + PREVIEW GRID ═══ */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <Tabs className="space-y-5">
              <TabsList className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-6">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.key} isActive={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent>
                <ContentReveal keyProp={activeTab}>
                {/* ===== PERSONAL ===== */}
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <ResumeImport onApply={handleApplyResume} />
                    <SectionLabel>Personal Info</SectionLabel>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Name *</FieldLabel>
                        <Input value={portfolio.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Your full name" />
                      </div>
                      <div>
                        <FieldLabel>Professional Title *</FieldLabel>
                        <div className="flex items-center gap-2">
                          <Input className="flex-1" value={portfolio.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Full-Stack Developer" />
                          <AiButton onClick={handleSuggestHeadline} loading={isGeneratingHeadline}>✨</AiButton>
                        </div>
                        {headlineError && <p className="mt-1 text-xs text-red-600">{headlineError}</p>}
                        {aiSuggestion?.fieldKey === 'title' && <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Email</FieldLabel>
                          <Input type="email" value={portfolio.email ?? ''} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" />
                        </div>
                        <div>
                          <FieldLabel>Phone</FieldLabel>
                          <Input value={portfolio.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Location</FieldLabel>
                        <Input value={portfolio.location ?? ''} onChange={(e) => updateField('location', e.target.value)} placeholder="City, Country" />
                      </div>
                      <div>
                        <FieldLabel>Profile Image URL</FieldLabel>
                        <Input value={portfolio.avatarUrl ?? ''} onChange={(e) => updateField('avatarUrl', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <FieldLabel>LinkedIn</FieldLabel>
                          <Input value={portfolio.linkedinUrl ?? ''} onChange={(e) => updateField('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div>
                          <FieldLabel>GitHub</FieldLabel>
                          <Input value={portfolio.githubUrl ?? ''} onChange={(e) => updateField('githubUrl', e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div>
                          <FieldLabel>Website</FieldLabel>
                          <Input value={portfolio.websiteUrl ?? ''} onChange={(e) => updateField('websiteUrl', e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== ABOUT ===== */}
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <SectionLabel>About</SectionLabel>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel>About Me *</FieldLabel>
                      <AiButton onClick={handleGenerateAbout} loading={isGeneratingAbout}>Generate with AI</AiButton>
                    </div>
                    {aboutError && <p className="text-xs text-red-600">{aboutError}</p>}
                    {aiSuggestion?.fieldKey === 'about' && <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />}
                    <Textarea rows={8} value={portfolio.about} onChange={(e) => updateField('about', e.target.value)} placeholder="Tell visitors about yourself, your background, and what drives you." />
                  </div>
                )}

                {/* ===== SKILLS ===== */}
                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <SectionLabel>Skills</SectionLabel>
                      <AiButton onClick={handleGenerateSkills} loading={isGeneratingSkills}>Suggest Skills</AiButton>
                    </div>
                    {skillsError && <p className="text-xs text-red-600">{skillsError}</p>}
                    {aiSuggestion?.fieldKey === 'skills' && <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />}
                    <p className="text-[11px] text-slate-400">Enter skills separated by commas.</p>
                    <Textarea rows={4} value={portfolio.skills.join(', ')} onChange={(e) => updateField('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="React, Next.js, UI Design, TypeScript" />
                    {portfolio.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {portfolio.skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== PROJECTS ===== */}
                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    <SectionLabel>Projects</SectionLabel>
                    {portfolio.projects.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm text-slate-500">No projects yet.</p>
                        <p className="mt-1 text-xs text-slate-400">Add one to showcase your work.</p>
                      </div>
                    )}
                    {portfolio.projects.map((project, index) => (
                      <div key={project.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-800">Project {index + 1}</h3>
                          <button type="button" onClick={() => removeProject(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                        </div>
                        <Input value={project.name} onChange={(e) => updateProject(index, { name: e.target.value })} placeholder="Project title *" />
                        <div className="flex flex-wrap gap-2">
                          <AiButton onClick={() => handleGenerateProjectDescription(index)} loading={isGeneratingProject}>Improve Description</AiButton>
                          <AiButton onClick={() => handleSuggestTechStack(index)} loading={isGeneratingTechStack}>Suggest Tech Stack</AiButton>
                        </div>
                        {projectError && <p className="text-xs text-red-600">{projectError}</p>}
                        {techStackError && <p className="text-xs text-red-600">{techStackError}</p>}
                        {(aiSuggestion?.fieldKey === `project-desc-${index}` || aiSuggestion?.fieldKey === `project-tech-${index}`) && (
                          <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />
                        )}
                        <Textarea rows={3} value={project.description} onChange={(e) => updateProject(index, { description: e.target.value })} placeholder="Describe the project *" />
                        <Input value={project.techStack.join(', ')} onChange={(e) => updateProject(index, { techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Technologies (comma separated)" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input value={project.link ?? ''} onChange={(e) => updateProject(index, { link: e.target.value })} placeholder="Live URL" />
                          <Input value={project.githubUrl ?? ''} onChange={(e) => updateProject(index, { githubUrl: e.target.value })} placeholder="GitHub URL" />
                        </div>
                        <Input value={project.imageUrl ?? ''} onChange={(e) => updateProject(index, { imageUrl: e.target.value })} placeholder="Image URL" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addProject} size="sm">+ Add Project</Button>
                  </div>
                )}

                {/* ===== EXPERIENCE ===== */}
                {activeTab === 'experience' && (
                  <div className="space-y-4">
                    <SectionLabel>Experience</SectionLabel>
                    {portfolio.experience.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm text-slate-500">No experience entries yet.</p>
                        <p className="mt-1 text-xs text-slate-400">Add your work history.</p>
                      </div>
                    )}
                    {portfolio.experience.map((exp, index) => (
                      <div key={exp.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-800">Experience {index + 1}</h3>
                          <button type="button" onClick={() => removeExperience(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input value={exp.company} onChange={(e) => updateExperience(index, { company: e.target.value })} placeholder="Company *" />
                          <Input value={exp.role} onChange={(e) => updateExperience(index, { role: e.target.value })} placeholder="Position / Role *" />
                        </div>
                        <Input value={exp.location ?? ''} onChange={(e) => updateExperience(index, { location: e.target.value })} placeholder="Location" />
                        <div className="flex flex-wrap gap-2">
                          <AiButton onClick={() => handleGenerateExperienceDescription(index)} loading={isGeneratingExp}>Improve Description</AiButton>
                          <AiButton onClick={() => handleGenerateHighlights(index)} loading={isGeneratingHighlights}>Generate Highlights</AiButton>
                        </div>
                        {expError && <p className="text-xs text-red-600">{expError}</p>}
                        {highlightsError && <p className="text-xs text-red-600">{highlightsError}</p>}
                        {(aiSuggestion?.fieldKey === `exp-desc-${index}` || aiSuggestion?.fieldKey === `exp-highlights-${index}`) && (
                          <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={exp.startDate} onChange={(e) => updateExperience(index, { startDate: e.target.value })} placeholder="Start (e.g. Jan 2022)" />
                          <Input value={exp.current ? '' : (exp.endDate ?? '')} onChange={(e) => updateExperience(index, { endDate: e.target.value, current: false })} placeholder="End" disabled={exp.current} />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          <input type="checkbox" checked={exp.current ?? false} onChange={(e) => updateExperience(index, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} />
                          I currently work here
                        </label>
                        <Textarea rows={3} value={exp.description} onChange={(e) => updateExperience(index, { description: e.target.value })} placeholder="Responsibilities and achievements" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addExperience} size="sm">+ Add Experience</Button>
                  </div>
                )}

                {/* ===== EDUCATION ===== */}
                {activeTab === 'education' && (
                  <div className="space-y-4">
                    <SectionLabel>Education</SectionLabel>
                    {portfolio.education.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm text-slate-500">No education entries yet.</p>
                        <p className="mt-1 text-xs text-slate-400">Add your academic background.</p>
                      </div>
                    )}
                    {portfolio.education.map((edu, index) => (
                      <div key={edu.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-800">Education {index + 1}</h3>
                          <button type="button" onClick={() => removeEducation(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                        </div>
                        <Input value={edu.school} onChange={(e) => updateEducation(index, { school: e.target.value })} placeholder="Institution *" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input value={edu.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} placeholder="Degree (e.g. B.Sc.)" />
                          <Input value={edu.field ?? ''} onChange={(e) => updateEducation(index, { field: e.target.value })} placeholder="Field of study" />
                        </div>
                        <AiButton onClick={() => handleGenerateEducationDescription(index)} loading={isGeneratingEdu}>Improve Description</AiButton>
                        {eduError && <p className="text-xs text-red-600">{eduError}</p>}
                        {aiSuggestion?.fieldKey === `edu-desc-${index}` && <AiSuggestionPanel suggestion={aiSuggestion.suggestion} onAccept={acceptSuggestion} onRegenerate={regenerateSuggestion} onCancel={cancelSuggestion} />}
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={edu.startDate ?? ''} onChange={(e) => updateEducation(index, { startDate: e.target.value })} placeholder="Start year" />
                          <Input value={edu.endDate ?? ''} onChange={(e) => updateEducation(index, { endDate: e.target.value })} placeholder="End year" />
                        </div>
                        <Textarea rows={2} value={edu.description ?? ''} onChange={(e) => updateEducation(index, { description: e.target.value })} placeholder="Additional details (optional)" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addEducation} size="sm">+ Add Education</Button>
                  </div>
                )}
                </ContentReveal>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
              <Preview portfolio={previewData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

// ── Helper components ───────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">{children}</h2>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600">{children}</label>;
}

function AiButton({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={loading} className="text-xs text-indigo-600 hover:text-indigo-800 hover:border-indigo-200">
      {loading ? (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating…
        </span>
      ) : (
        <span>✨ {children}</span>
      )}
    </Button>
  );
}

function AiSuggestionPanel({ suggestion, onAccept, onRegenerate, onCancel }: {
  suggestion: string | string[]; onAccept: () => void; onRegenerate: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">AI Suggestion</p>
      {Array.isArray(suggestion) ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestion.map((s) => (
            <span key={s} className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs text-indigo-800">{s}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-700">{suggestion}</p>
      )}
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={onAccept} className="bg-indigo-600 text-white hover:bg-indigo-700">Accept</Button>
        <Button type="button" variant="outline" size="sm" onClick={onRegenerate}>Regenerate</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </motion.div>
  );
}
