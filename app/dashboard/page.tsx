'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Portfolio, Project, Experience, Education } from '@/types/portfolio';
import { CANONICAL_TEMPLATES } from '@/components/templates/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageTransition, SectionReveal, HoverLift, PressScale, StatusBanner, AnimatePresence } from '@/lib/motion';
import { motion } from 'motion/react';

const emptyProject = (): Project => ({
  id: `p-${Date.now()}`,
  name: '',
  description: '',
  techStack: [],
  link: '',
  githubUrl: '',
  imageUrl: '',
});

const emptyExperience = (): Experience => ({
  id: `e-${Date.now()}`,
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

const emptyEducation = (): Education => ({
  id: `ed-${Date.now()}`,
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  description: '',
});

const emptyPortfolio = (): Portfolio => ({
  id: '',
  name: '',
  title: '',
  about: '',
  email: '',
  phone: '',
  location: '',
  avatarUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  websiteUrl: '',
  skills: [],
  projects: [],
  experience: [],
  education: [],
  template: 'minimal',
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [draft, setDraft] = useState<Portfolio>(emptyPortfolio());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!db || !isFirebaseConfigured || !user) return;

    const ref = collection(db, 'portfolios');
    const q = query(ref, where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Portfolio),
          id: docSnap.id,
        }));
        setPortfolios(items);
      },
      (error) => {
        console.error('Failed to listen to portfolios:', error);
        setError('Failed to load portfolios. Please refresh the page.');
      },
    );

    return () => unsubscribe();
  }, [user]);

  const shareUrl = useMemo(() => {
    if (!user?.uid || !editingId) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/portfolio/${editingId}`;
  }, [editingId, user?.uid]);

  // --- Draft updaters ---
  function updateDraft<K extends keyof Portfolio>(field: K, value: Portfolio[K]) {
    setDraft((c) => ({ ...c, [field]: value }));
  }

  // Projects
  function updateDraftProject(index: number, patch: Partial<Project>) {
    setDraft((c) => ({
      ...c,
      projects: c.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }
  function addDraftProject() {
    setDraft((c) => ({ ...c, projects: [...c.projects, emptyProject()] }));
  }
  function removeDraftProject(index: number) {
    setDraft((c) => ({ ...c, projects: c.projects.filter((_, i) => i !== index) }));
  }

  // Experience
  function updateDraftExperience(index: number, patch: Partial<Experience>) {
    setDraft((c) => ({
      ...c,
      experience: c.experience.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }
  function addDraftExperience() {
    setDraft((c) => ({ ...c, experience: [...c.experience, emptyExperience()] }));
  }
  function removeDraftExperience(index: number) {
    setDraft((c) => ({ ...c, experience: c.experience.filter((_, i) => i !== index) }));
  }

  // Education
  function updateDraftEducation(index: number, patch: Partial<Education>) {
    setDraft((c) => ({
      ...c,
      education: c.education.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }
  function addDraftEducation() {
    setDraft((c) => ({ ...c, education: [...c.education, emptyEducation()] }));
  }
  function removeDraftEducation(index: number) {
    setDraft((c) => ({ ...c, education: c.education.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    if (!db || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Add your Firebase credentials to enable saving.');
      return;
    }
    if (!user) {
      setError('You must be signed in to save a portfolio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const { id: _id, ...rest } = draft;
      const payload = {
        ...rest,
        userId: user.uid,
        updatedAt: now,
        ...(editingId ? {} : { createdAt: now }),
      };

      if (editingId) {
        await updateDoc(doc(db, 'portfolios', editingId), payload);
      } else {
        const docRef = await addDoc(collection(db, 'portfolios'), { ...payload, createdAt: now });
        setEditingId(docRef.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || !isFirebaseConfigured) return;
    if (!window.confirm('Delete this portfolio? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'portfolios', id));
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
    }
  }

  function startEdit(item: Portfolio) {
    setDraft(item);
    setEditingId(item.id);
    setExpandedSection('personal');
  }

  function toggleSection(section: string) {
    setExpandedSection((prev) => (prev === section ? null : section));
  }

  function handleCopyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  }

  return (
    <PageTransition className="space-y-6 overflow-x-hidden">
      {/* ═══ HEADER ═══ */}
      <SectionReveal>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
              <h1 className="mt-0.5 text-xl font-bold text-slate-900">Manage your portfolios</h1>
              <p className="mt-0.5 text-xs text-slate-500">Create, edit, and share your career portfolios.</p>
            </div>
            <PressScale>
              <Button
                onClick={() => { setDraft(emptyPortfolio()); setEditingId(null); setExpandedSection('personal'); }}
                size="sm"
              >
                + New Portfolio
              </Button>
            </PressScale>
          </div>
        </div>
      </SectionReveal>

      {/* Error banner */}
      <StatusBanner visible={!!error}>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </StatusBanner>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* ===== EDITOR ===== */}
        <SectionReveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">
                {editingId ? 'Edit Portfolio' : 'Create Portfolio'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {editingId ? 'Update your portfolio details below.' : 'Fill in the sections to build your portfolio.'}
              </p>
            </div>
            <div className="space-y-0 p-5">
              {/* Personal */}
              <CollapsibleSection title="Personal Info" open={expandedSection === 'personal'} onToggle={() => toggleSection('personal')}>
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Name *</FieldLabel>
                    <Input placeholder="Your full name" value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Professional Title *</FieldLabel>
                    <Input placeholder="e.g. Full-Stack Developer" value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <Input placeholder="you@example.com" type="email" value={draft.email ?? ''} onChange={(e) => updateDraft('email', e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <Input placeholder="+1 (555) 123-4567" value={draft.phone ?? ''} onChange={(e) => updateDraft('phone', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Location</FieldLabel>
                    <Input placeholder="City, Country" value={draft.location ?? ''} onChange={(e) => updateDraft('location', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Profile Image URL</FieldLabel>
                    <Input placeholder="https://..." value={draft.avatarUrl ?? ''} onChange={(e) => updateDraft('avatarUrl', e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <FieldLabel>LinkedIn</FieldLabel>
                      <Input placeholder="https://linkedin.com/in/..." value={draft.linkedinUrl ?? ''} onChange={(e) => updateDraft('linkedinUrl', e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>GitHub</FieldLabel>
                      <Input placeholder="https://github.com/..." value={draft.githubUrl ?? ''} onChange={(e) => updateDraft('githubUrl', e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Website</FieldLabel>
                      <Input placeholder="https://..." value={draft.websiteUrl ?? ''} onChange={(e) => updateDraft('websiteUrl', e.target.value)} />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* About */}
              <CollapsibleSection title="About" open={expandedSection === 'about'} onToggle={() => toggleSection('about')}>
                <Textarea rows={5} placeholder="Tell visitors about yourself, your background, and what drives you." value={draft.about} onChange={(e) => updateDraft('about', e.target.value)} />
              </CollapsibleSection>

              {/* Skills */}
              <CollapsibleSection title="Skills" open={expandedSection === 'skills'} onToggle={() => toggleSection('skills')}>
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">Enter skills separated by commas.</p>
                  <Input placeholder="React, Next.js, UI Design, TypeScript" value={draft.skills.join(', ')} onChange={(e) => updateDraft('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
                  {draft.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {draft.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Projects */}
              <CollapsibleSection title={`Projects (${draft.projects.length})`} open={expandedSection === 'projects'} onToggle={() => toggleSection('projects')}>
                <div className="space-y-3">
                  {draft.projects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-500">No projects yet.</p>
                      <p className="mt-1 text-xs text-slate-400">Add one to showcase your work.</p>
                    </div>
                  )}
                  {draft.projects.map((project, index) => (
                    <div key={project.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Project {index + 1}</h3>
                        <button type="button" onClick={() => removeDraftProject(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                      </div>
                      <Input placeholder="Project title *" value={project.name} onChange={(e) => updateDraftProject(index, { name: e.target.value })} />
                      <Textarea rows={2} placeholder="Describe the project" value={project.description} onChange={(e) => updateDraftProject(index, { description: e.target.value })} />
                      <Input placeholder="Technologies (comma separated)" value={project.techStack.join(', ')} onChange={(e) => updateDraftProject(index, { techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Live URL" value={project.link ?? ''} onChange={(e) => updateDraftProject(index, { link: e.target.value })} />
                        <Input placeholder="GitHub URL" value={project.githubUrl ?? ''} onChange={(e) => updateDraftProject(index, { githubUrl: e.target.value })} />
                      </div>
                      <Input placeholder="Image URL" value={project.imageUrl ?? ''} onChange={(e) => updateDraftProject(index, { imageUrl: e.target.value })} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDraftProject}>+ Add Project</Button>
                </div>
              </CollapsibleSection>

              {/* Experience */}
              <CollapsibleSection title={`Experience (${draft.experience.length})`} open={expandedSection === 'experience'} onToggle={() => toggleSection('experience')}>
                <div className="space-y-3">
                  {draft.experience.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-500">No experience entries yet.</p>
                      <p className="mt-1 text-xs text-slate-400">Add your work history.</p>
                    </div>
                  )}
                  {draft.experience.map((exp, index) => (
                    <div key={exp.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Experience {index + 1}</h3>
                        <button type="button" onClick={() => removeDraftExperience(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Company *" value={exp.company} onChange={(e) => updateDraftExperience(index, { company: e.target.value })} />
                        <Input placeholder="Position / Role *" value={exp.role} onChange={(e) => updateDraftExperience(index, { role: e.target.value })} />
                      </div>
                      <Input placeholder="Location" value={exp.location ?? ''} onChange={(e) => updateDraftExperience(index, { location: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Start (e.g. Jan 2022)" value={exp.startDate} onChange={(e) => updateDraftExperience(index, { startDate: e.target.value })} />
                        <Input placeholder="End" value={exp.current ? '' : (exp.endDate ?? '')} onChange={(e) => updateDraftExperience(index, { endDate: e.target.value, current: false })} disabled={exp.current} />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <input type="checkbox" checked={exp.current ?? false} onChange={(e) => updateDraftExperience(index, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} />
                        I currently work here
                      </label>
                      <Textarea rows={2} placeholder="Responsibilities and achievements" value={exp.description} onChange={(e) => updateDraftExperience(index, { description: e.target.value })} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDraftExperience}>+ Add Experience</Button>
                </div>
              </CollapsibleSection>

              {/* Education */}
              <CollapsibleSection title={`Education (${draft.education.length})`} open={expandedSection === 'education'} onToggle={() => toggleSection('education')}>
                <div className="space-y-3">
                  {draft.education.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-500">No education entries yet.</p>
                      <p className="mt-1 text-xs text-slate-400">Add your academic background.</p>
                    </div>
                  )}
                  {draft.education.map((edu, index) => (
                    <div key={edu.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Education {index + 1}</h3>
                        <button type="button" onClick={() => removeDraftEducation(index)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                      </div>
                      <Input placeholder="Institution *" value={edu.school} onChange={(e) => updateDraftEducation(index, { school: e.target.value })} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Degree (e.g. B.Sc.)" value={edu.degree} onChange={(e) => updateDraftEducation(index, { degree: e.target.value })} />
                        <Input placeholder="Field of study" value={edu.field ?? ''} onChange={(e) => updateDraftEducation(index, { field: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Start year" value={edu.startDate ?? ''} onChange={(e) => updateDraftEducation(index, { startDate: e.target.value })} />
                        <Input placeholder="End year" value={edu.endDate ?? ''} onChange={(e) => updateDraftEducation(index, { endDate: e.target.value })} />
                      </div>
                      <Textarea rows={2} placeholder="Additional details (optional)" value={edu.description ?? ''} onChange={(e) => updateDraftEducation(index, { description: e.target.value })} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDraftEducation}>+ Add Education</Button>
                </div>
              </CollapsibleSection>

              {/* Template */}
              <CollapsibleSection title="Template" open={expandedSection === 'template'} onToggle={() => toggleSection('template')}>
                <div className="flex flex-wrap gap-1.5">
                  {CANONICAL_TEMPLATES.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateDraft('template', opt.key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        draft.template === opt.key
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Visibility */}
              <CollapsibleSection title="Visibility" open={expandedSection === 'visibility'} onToggle={() => toggleSection('visibility')}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateDraft('isPublic', true)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        draft.isPublic
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${draft.isPublic ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDraft('isPublic', false)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        !draft.isPublic
                          ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${!draft.isPublic ? 'bg-slate-500' : 'bg-slate-400'}`} />
                      Private
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {draft.isPublic
                      ? 'Anyone with the link can view this portfolio.'
                      : 'Only you can see this portfolio. The public link will not work.'}
                  </p>
                </div>
              </CollapsibleSection>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                <PressScale>
                  <Button onClick={() => { void handleSave(); }} disabled={loading} size="sm">
                    {loading ? 'Saving…' : 'Save to Firestore'}
                  </Button>
                </PressScale>
                <PressScale>
                  <Button variant="outline" size="sm" onClick={() => { setDraft(emptyPortfolio()); setEditingId(null); }}>
                    Reset
                  </Button>
                </PressScale>
              </div>

              {/* Share URL */}
              {editingId && (
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Share link</span>
                    {draft.isPublic && (
                      <button
                        type="button"
                        onClick={handleCopyShareUrl}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        {copiedUrl ? '✓ Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  {draft.isPublic ? (
                    <a className="break-all text-xs text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800" href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
                  ) : (
                    <p className="text-xs text-slate-400">This portfolio is private. Make it public to get a shareable link.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionReveal>

        {/* ===== PORTFOLIO LIST ===== */}
        <SectionReveal delay={0.2}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Your Portfolios</p>
              <p className="mt-0.5 text-xs text-slate-500">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} saved</p>
            </div>
            <div className="space-y-3 p-5">
              {portfolios.length === 0 ? (
                <SectionReveal>
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm text-slate-500">No portfolios yet.</p>
                    <p className="mt-1 text-xs text-slate-400">Create one to get started.</p>
                  </div>
                </SectionReveal>
              ) : (
                portfolios.map((item) => (
                  <HoverLift key={item.id}>
                    <div className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.name || 'Untitled'}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              item.isPublic
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${item.isPublic ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {item.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{item.title || 'No title'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                              {CANONICAL_TEMPLATES.find((t) => t.key === item.template)?.label || item.template}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => startEdit(item)} className="text-xs">Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => { void handleDelete(item.id); }} className="text-xs text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700">Delete</Button>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        {item.isPublic ? (
                          <div className="flex flex-wrap gap-2">
                            <a className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100" href={`/portfolio/${item.id}`}>Open</a>
                            <a className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100" href={`/portfolio/${item.id}`} target="_blank" rel="noreferrer">Share ↗</a>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">Private — no public link available</p>
                        )}
                      </div>
                    </div>
                  </HoverLift>
                ))
              )}
            </div>
          </div>
        </SectionReveal>
      </div>
    </PageTransition>
  );
}

// ── Helper components ───────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600">{children}</label>;
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left transition hover:bg-slate-50/50"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">{title}</span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-indigo-400"
        >▾</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
