'use client';

import { useState, useEffect, useMemo } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Portfolio } from '@/types/portfolio';
import type { CareerProfile, Certification, Achievement, CareerEvidence, DerivedSkillIntelligence, SkillEvidenceReport, CareerGapAnalysis, StructuredCareerRecommendation, StructuredRecommendationsInput, CareerProjectIdea, ProjectIdeasInput, CareerProjectBlueprint, CareerDevelopmentRoadmap, CareerProjectDocumentationPack } from '@/types/career';
import { deriveEvidenceFromPortfolio, deriveCertificationEvidence, deriveGitHubEvidence } from '@/lib/evidence';
import { deriveSkillIntelligence } from '@/lib/skillIntelligence';
import { buildAllEvidenceReports, findSkillEvidenceReport } from '@/lib/evidenceIntelligence';
import { analyzeCareerGaps } from '@/lib/careerGapIntelligence';
import { buildRecommendationInput, validateRecommendations, parseGeminiResponse } from '@/lib/careerRecommendationEngine';
import { buildProjectIdeasInput, validateProjectIdeas, parseProjectIdeasResponse } from '@/lib/projectIdeaEngine';
import { buildBlueprintInput, validateBlueprint, parseBlueprintResponse } from '@/lib/projectBlueprintEngine';
import { buildRoadmapInput, validateRoadmap, parseRoadmapResponse } from '@/lib/roadmapEngine';
import { buildDocsInput, validateDocsPack, parseDocsPackResponse } from '@/lib/docsPackEngine';
import { generateStructuredCareerRecommendations, generateProjectIdeas, generateBlueprint, generateRoadmap, generateDocsPack } from '@/lib/gemini';
import {
  calculateCareerReadiness,
  calculateProfileCompleteness,
  deriveStrengths,
  deriveGaps,
  calculateSkillEvidenceScores,
  calculateRoleReadiness,
} from '@/lib/careerScoring';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CareerHero,
  CareerSnapshot,
  CareerJourney,
  NextBestAction,
  SkillIntelligenceList,
  SkillEvidenceList,
  RecommendationList,
  CareerStrengths,
  CareerGaps,
  ProjectExplorer,
  CollapsibleSection,
  JobDescriptionAnalyzer,
} from '@/components/career';
import { GitHubRepositoryList } from '@/components/career/GitHubRepositoryList';
import { PageTransition, SectionReveal, StaggerList, StaggerItem, HoverLift, StatusBanner, AnimatePresence } from '@/lib/motion';
import { motion } from 'motion/react';

const emptyCertification = (): Certification => ({
  id: `cert-${Date.now()}`, name: '', issuer: '', date: '', url: '',
});

const emptyAchievement = (): Achievement => ({
  id: `ach-${Date.now()}`, title: '', description: '', date: '',
});

const emptyCareerProfile = (): CareerProfile => ({
  id: '', userId: '', isPublic: true, professionalTitle: '', careerSummary: '', careerInterests: [],
  githubUrl: '', linkedinUrl: '', certifications: [], achievements: [], languages: [],
  targetRoles: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

export default function CareerPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CareerProfile>(emptyCareerProfile());
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('career-info');
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const [evidence, setEvidence] = useState<CareerEvidence[]>([]);
  const [isBuildingEvidence, setIsBuildingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [structuredRecs, setStructuredRecs] = useState<StructuredCareerRecommendation[] | null>(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [projectIdeas, setProjectIdeas] = useState<CareerProjectIdea[] | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<CareerProjectIdea | null>(null);
  const [blueprint, setBlueprint] = useState<CareerProjectBlueprint | null>(null);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<CareerDevelopmentRoadmap | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [docsPack, setDocsPack] = useState<CareerProjectDocumentationPack | null>(null);
  const [isGeneratingDocsPack, setIsGeneratingDocsPack] = useState(false);
  const [docsPackError, setDocsPackError] = useState<string | null>(null);

  // ── Firestore subscriptions ───────────────────────────────
  useEffect(() => {
    if (!db || !isFirebaseConfigured || !user) { setLoading(false); return; }
    const unsub = onSnapshot(
      query(collection(db, 'careerProfiles'), where('userId', '==', user.uid)),
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setProfile({ ...(d.data() as CareerProfile), id: d.id });
          setSavedId(d.id);
        } else { setProfile(emptyCareerProfile()); setSavedId(null); }
        setLoading(false);
      },
      (error) => {
        console.error('Failed to listen to career profiles:', error);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!db || !isFirebaseConfigured || !user) return;
    const unsub = onSnapshot(
      query(collection(db, 'portfolios'), where('userId', '==', user.uid)),
      (snap) => { setPortfolioData(!snap.empty ? { ...(snap.docs[0].data() as Portfolio), id: snap.docs[0].id } : null); },
      (err) => console.error('Firestore listener error (portfolios):', err)
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!db || !isFirebaseConfigured || !user) return;
    const unsub = onSnapshot(
      query(collection(db, 'careerEvidence'), where('userId', '==', user.uid)),
      (snap) => { setEvidence(snap.docs.map((d) => ({ ...(d.data() as CareerEvidence), id: d.id }))); },
      (err) => console.error('Firestore listener error (evidence):', err)
    );
    return () => unsub();
  }, [user]);

  // ── Computed intelligence values ──────────────────────────
  const readiness = useMemo(() => calculateCareerReadiness(portfolioData, profile, evidence), [portfolioData, profile, evidence]);
  const completeness = useMemo(() => calculateProfileCompleteness(portfolioData, profile), [portfolioData, profile]);
  const strengths = useMemo(() => deriveStrengths(portfolioData, profile, evidence), [portfolioData, profile, evidence]);
  const gaps = useMemo(() => deriveGaps(portfolioData, profile, evidence), [portfolioData, profile, evidence]);
  const skillEvidenceScores = useMemo(() => calculateSkillEvidenceScores(portfolioData, evidence), [portfolioData, evidence]);
  const skillIntelligence = useMemo(() => portfolioData ? deriveSkillIntelligence(portfolioData, evidence) : [], [portfolioData, evidence]);
  const evidenceReports = useMemo(() => buildAllEvidenceReports(skillIntelligence, evidence), [skillIntelligence, evidence]);
  const gapAnalysis = useMemo(() => analyzeCareerGaps(
    skillIntelligence,
    profile?.targetRoles ?? [],
    profile?.professionalTitle ?? '',
  ), [skillIntelligence, profile]);
  
  const roleReadiness = useMemo(() => calculateRoleReadiness(gapAnalysis), [gapAnalysis]);

  const recInput = useMemo(() => buildRecommendationInput(
    skillIntelligence,
    gapAnalysis,
    portfolioData?.projects.length ?? 0,
    portfolioData?.experience.length ?? 0,
  ), [skillIntelligence, gapAnalysis, portfolioData]);

  const ideasInput = useMemo(() => buildProjectIdeasInput(
    gapAnalysis,
    skillIntelligence,
    portfolioData?.projects.length ?? 0,
    portfolioData?.projects.map((p) => p.name) ?? [],
  ), [gapAnalysis, skillIntelligence, portfolioData]);

  const blueprintInput = useMemo(() => buildBlueprintInput(
    selectedIdea,
    gapAnalysis,
  ), [selectedIdea, gapAnalysis]);

  const roadmapInput = useMemo(() => buildRoadmapInput(
    blueprint,
    selectedIdea?.skillsToDemonstrate ?? [],
  ), [blueprint, selectedIdea]);

  const docsInput = useMemo(() => buildDocsInput(
    blueprint,
    roadmap,
    selectedIdea?.skillsToDemonstrate ?? [],
  ), [blueprint, roadmap, selectedIdea]);

  // ── Structured recommendation handler ────────────────────
  async function handleGenerateRecommendations() {
    if (!recInput) {
      setRecsError('Insufficient career data to generate recommendations.');
      return;
    }
    setIsGeneratingRecs(true);
    setRecsError(null);
    setStructuredRecs(null);

    try {
      const result = await generateStructuredCareerRecommendations(recInput, await user?.getIdToken());
      if (result.error) {
        setRecsError(result.error);
      } else if (result.data) {
        const validated = validateRecommendations(result.data, recInput);
        if (validated.length === 0) {
          setRecsError('Could not generate valid recommendations from the AI response. Please try again.');
        } else {
          setStructuredRecs(validated);
        }
      } else {
        setRecsError('No response received. Please try again.');
      }
    } catch {
      setRecsError('Something went wrong while generating recommendations. Please try again.');
    } finally {
      setIsGeneratingRecs(false);
    }
  }

  // ── Project ideas handler ────────────────────────────────
  async function handleGenerateProjectIdeas() {
    if (!ideasInput) {
      setIdeasError('Insufficient career data to generate project ideas. Set a target role and identify career gaps first.');
      return;
    }
    setIsGeneratingIdeas(true);
    setIdeasError(null);
    setProjectIdeas(null);

    try {
      const result = await generateProjectIdeas(ideasInput, await user?.getIdToken());
      if (result.error) {
        setIdeasError(result.error);
      } else if (result.data) {
        const raw = parseProjectIdeasResponse(JSON.stringify(result.data));
        const validated = validateProjectIdeas(raw, ideasInput);
        if (validated.length === 0) {
          setIdeasError('Could not generate valid project ideas from the AI response. Please try again.');
        } else {
          setProjectIdeas(validated);
        }
      } else {
        setIdeasError('No response received. Please try again.');
      }
    } catch {
      setIdeasError('Something went wrong while generating project ideas. Please try again.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  // ── Blueprint handler ────────────────────────────────────
  async function handleGenerateBlueprint() {
    if (!blueprintInput) {
      setBlueprintError('Select a project idea first to generate a technical blueprint.');
      return;
    }
    setIsGeneratingBlueprint(true);
    setBlueprintError(null);
    setBlueprint(null);

    try {
      const result = await generateBlueprint(blueprintInput, await user?.getIdToken());
      if (result.error) {
        setBlueprintError('Unable to generate the technical blueprint. Please try again.');
      } else if (result.data) {
        const raw = parseBlueprintResponse(JSON.stringify(result.data));
        const validated = validateBlueprint(raw, blueprintInput);
        if (!validated) {
          setBlueprintError('Unable to generate the technical blueprint. Please try again.');
        } else {
          setBlueprint(validated);
        }
      } else {
        setBlueprintError('Unable to generate the technical blueprint. Please try again.');
      }
    } catch {
      setBlueprintError('Unable to generate the technical blueprint. Please try again.');
    } finally {
      setIsGeneratingBlueprint(false);
    }
  }

  // ── Roadmap handler ──────────────────────────────────────
  async function handleGenerateRoadmap() {
    if (!roadmapInput) {
      setRoadmapError('Generate a technical blueprint first.');
      return;
    }
    setIsGeneratingRoadmap(true);
    setRoadmapError(null);
    setRoadmap(null);

    try {
      const result = await generateRoadmap(roadmapInput, await user?.getIdToken());
      if (result.error) {
        setRoadmapError('Unable to generate the development roadmap. Please try again.');
      } else if (result.data) {
        const raw = parseRoadmapResponse(JSON.stringify(result.data));
        const validated = validateRoadmap(raw, roadmapInput);
        if (!validated) {
          setRoadmapError('Unable to generate the development roadmap. Please try again.');
        } else {
          setRoadmap(validated);
        }
      } else {
        setRoadmapError('Unable to generate the development roadmap. Please try again.');
      }
    } catch {
      setRoadmapError('Unable to generate the development roadmap. Please try again.');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  }

  // ── Docs Pack handler ───────────────────────────────────
  async function handleGenerateDocsPack() {
    if (!docsInput) {
      setDocsPackError('Generate the technical blueprint and development roadmap first.');
      return;
    }
    setIsGeneratingDocsPack(true);
    setDocsPackError(null);
    setDocsPack(null);

    try {
      const result = await generateDocsPack(docsInput, await user?.getIdToken());
      if (result.error) {
        setDocsPackError('Unable to generate the documentation pack. Please try again.');
      } else if (result.data) {
        const raw = parseDocsPackResponse(JSON.stringify(result.data));
        const validated = validateDocsPack(raw, docsInput);
        if (!validated) {
          setDocsPackError('Unable to generate the documentation pack. Please try again.');
        } else {
          setDocsPack(validated);
        }
      } else {
        setDocsPackError('Unable to generate the documentation pack. Please try again.');
      }
    } catch {
      setDocsPackError('Unable to generate the documentation pack. Please try again.');
    } finally {
      setIsGeneratingDocsPack(false);
    }
  }

  // ── Handlers ──────────────────────────────────────────────
  async function handleBuildEvidence() {
    if (!db || !isFirebaseConfigured || !user) { setEvidenceError('Firebase is not configured.'); return; }
    if (!portfolioData) { setEvidenceError('No portfolio data to derive evidence from.'); return; }
    setIsBuildingEvidence(true); setEvidenceError(null);
    try {
      const existing = query(collection(db, 'careerEvidence'), where('userId', '==', user.uid));
      const snap = await new Promise<import('firebase/firestore').QuerySnapshot>((resolve) => {
        const unsub = onSnapshot(existing, (s) => { unsub(); resolve(s); });
      });
      for (const d of snap.docs) await deleteDoc(doc(db, 'careerEvidence', d.id));
      
      const newEvidence = deriveEvidenceFromPortfolio(portfolioData, user.uid);
      const certEvidence = deriveCertificationEvidence(portfolioData, profile, user.uid);
      
      // Fetch GitHub Repos and derive evidence
      let ghEvidence: CareerEvidence[] = [];
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/github/repos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const repos = await response.json();
          ghEvidence = deriveGitHubEvidence(repos, user.uid);
        }
      } catch (e) {
        console.error('Failed to fetch/derive GitHub evidence:', e);
      }
      
      const allNewEvidence = [...newEvidence, ...certEvidence, ...ghEvidence];
      for (const ev of allNewEvidence) { const { id: _id, ...rest } = ev; await addDoc(collection(db, 'careerEvidence'), rest); }
    } catch (err) { setEvidenceError(err instanceof Error ? err.message : 'Failed to build evidence.'); }
    finally { setIsBuildingEvidence(false); }
  }

  function updateField<K extends keyof CareerProfile>(field: K, value: CareerProfile[K]) {
    setProfile((c) => ({ ...c, [field]: value }));
  }

  function updateCertification(index: number, patch: Partial<Certification>) {
    setProfile((c) => ({ ...c, certifications: c.certifications.map((cert, i) => (i === index ? { ...cert, ...patch } : cert)) }));
  }
  function addCertification() { setProfile((c) => ({ ...c, certifications: [...c.certifications, emptyCertification()] })); }
  function removeCertification(index: number) { setProfile((c) => ({ ...c, certifications: c.certifications.filter((_, i) => i !== index) })); }

  function updateAchievement(index: number, patch: Partial<Achievement>) {
    setProfile((c) => ({ ...c, achievements: c.achievements.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  }
  function addAchievement() { setProfile((c) => ({ ...c, achievements: [...c.achievements, emptyAchievement()] })); }
  function removeAchievement(index: number) { setProfile((c) => ({ ...c, achievements: c.achievements.filter((_, i) => i !== index) })); }

  async function handleSave() {
    if (!db || !isFirebaseConfigured) { setSaveError('Firebase is not configured.'); return; }
    if (!user) { setSaveError('You must be signed in to save.'); return; }
    setIsSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const now = new Date().toISOString();
      const { id: _id, ...rest } = profile;
      const payload = { ...rest, userId: user.uid, updatedAt: now, ...(savedId ? {} : { createdAt: now }) };
      if (savedId) { await updateDoc(doc(db, 'careerProfiles', savedId), payload); }
      else { const ref = await addDoc(collection(db, 'careerProfiles'), { ...payload, createdAt: now }); setSavedId(ref.id); }
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to save.'); }
    finally { setIsSaving(false); }
  }

  function toggleSection(section: string) { setExpandedSection((prev) => (prev === section ? null : section)); }

  // ── Derived display values ────────────────────────────────
  const strongSkillCount = skillIntelligence.filter((s) => s.strengthLevel === 'strong' || s.strengthLevel === 'advanced').length;
  const totalGapCount = gapAnalysis.gaps.length;
  const readinessLabel = readiness.overall >= 75 ? 'Strong position' : readiness.overall >= 50 ? 'Good foundation' : readiness.overall >= 25 ? 'Building momentum' : readiness.overall > 0 ? 'Early stage' : '';
  const readinessSummary = readiness.overall > 0
    ? strengths.length > 0 && gapAnalysis.gaps.length > 0
      ? `You have strong evidence in ${strengths[0]?.text?.replace('Strong technical skill coverage', 'technical skills').replace('Good skill selection', 'skills').replace('Strong professional experience', 'professional experience').replace('Professional experience available', 'experience').replace('Multiple portfolio projects', 'projects').replace('Portfolio projects available', 'projects').toLowerCase() || 'your career'}, but ${gapAnalysis.gaps[0]?.skill || 'key areas'} ${gapAnalysis.gaps.length > 1 ? 'and more' : ''} currently represent${gapAnalysis.gaps.length === 1 ? 's' : ''} your biggest gap${gapAnalysis.gaps.length > 1 ? 's' : ''}.`
      : strengths.length > 0
        ? 'Your career profile is looking strong. Keep building evidence for even better results.'
        : 'Build your portfolio and evidence to discover your career strengths and gaps.'
    : '';

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────
  if (!portfolioData && !profile.professionalTitle && !profile.targetRoles.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 shadow-inner">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Build Your Career Profile</h1>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-500">
            Discover your career strengths, identify critical gaps, and get personalized project recommendations.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-100">
              <a href="/builder">Build My Career Profile</a>
            </Button>
          </div>
          <div className="mt-16 grid gap-4 text-left sm:grid-cols-2">
            {[
              { step: 1, text: 'Create or import your portfolio', icon: '🎨' },
              { step: 2, text: 'Add skills and experience', icon: '🛠' },
              { step: 3, text: 'Build career evidence', icon: '📈' },
              { step: 4, text: 'Discover career gaps', icon: '🎯' },
              { step: 5, text: 'Get your next best action', icon: '✨' },
            ].map((item) => (
              <div key={item.step} className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl group-hover:bg-indigo-50 transition-colors">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Step {item.step}</p>
                  <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────
  const snapshotStats: Array<{ label: string; value: string; accent: 'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' }> = [
    { label: 'Skills', value: String(portfolioData?.skills.length ?? 0), accent: 'indigo' },
    { label: 'Strong Skills', value: String(strongSkillCount), accent: 'emerald' },
    { label: 'Evidence', value: String(evidence.length), accent: 'blue' },
    { label: 'Career Gaps', value: String(totalGapCount), accent: totalGapCount > 0 ? 'amber' : 'emerald' },
    { label: 'Projects', value: String(portfolioData?.projects.length ?? 0), accent: 'violet' },
  ];

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">

      {/* ═══ HERO: CAREER READINESS ═══ */}
      <SectionReveal className="space-y-1">
        <div className="flex items-center gap-2">
          <a href="/dashboard" className="text-xs font-medium text-slate-400 transition hover:text-slate-600">Dashboard</a>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-indigo-600">Career Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Your Career Readiness</h1>
      </SectionReveal>

      <StatusBanner visible={!!saveError}>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>
      </StatusBanner>
      <StatusBanner visible={saveSuccess}>
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Career profile saved.</div>
      </StatusBanner>

      <CareerHero 
        readiness={readiness} 
        completeness={completeness} 
        summary={readinessSummary} 
      />

      {/* ═══ GITHUB EVIDENCE ═══ */}
      <CollapsibleSection title="GitHub Evidence" open={expandedSection === 'github-evidence'} onToggle={() => toggleSection('github-evidence')}>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">GitHub Repository Evidence</h3>
        <SkillEvidenceList 
          evidence={evidence.filter(e => e.sourceType === 'github')}
        />
      </CollapsibleSection>

      <GitHubRepositoryList />

      {/* ═══ ROLE READINESS ═══ */}
      <SectionReveal>
        <Card className="border-indigo-100 bg-white shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              {profile.targetRole ? `${profile.targetRole} Readiness` : 'Target Role Readiness'}
            </CardTitle>
            {roleReadiness && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {roleReadiness.percentage}% Ready
              </span>
            )}
          </CardHeader>
          <CardContent>
            {!profile.targetRole ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-slate-500">Select a target role in your profile to see your readiness analysis.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => toggleSection('target-role')}>Select Target Role</Button>
              </div>
            ) : !roleReadiness ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-slate-500">Readiness analysis is available for Frontend, Backend, Full-Stack, and AI Engineer roles.</p>
                <p className="text-xs text-slate-400 mt-1">Select a supported target role, or add more skills and evidence for better results.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                {/* Readiness Score */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50/50 p-6">
                  <div className="text-5xl font-extrabold text-indigo-700">{roleReadiness.percentage}%</div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">Overall Readiness</p>
                </div>

                {/* Readiness Breakdown */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                      <span>Evidence Coverage</span>
                      <span>{roleReadiness.evidenceCoverage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${roleReadiness.evidenceCoverage}%` }} />
                    </div>
                  </div>
                  <StaggerList className="grid grid-cols-3 gap-3">
                    <StaggerItem>
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                        <div className="text-lg font-bold text-emerald-700">{roleReadiness.matchedSkills.length}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Matched</div>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-center">
                        <div className="text-lg font-bold text-amber-700">{roleReadiness.developingSkills.length}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Developing</div>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-center">
                        <div className="text-lg font-bold text-red-700">{roleReadiness.missingSkills.length}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600">Missing</div>
                      </div>
                    </StaggerItem>
                  </StaggerList>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </SectionReveal>

      {/* ═══ CAREER SNAPSHOT ═══ */}
      <SectionReveal className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Career Snapshot</h2>
        <CareerSnapshot stats={snapshotStats} />
      </SectionReveal>

      {/* ═══ SKILL INTELLIGENCE ═══ */}
      <SectionReveal className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">🧠 Skill Intelligence</h2>
            <p className="text-sm text-slate-500 mt-1">Evidence-based strength assessment for each skill.</p>
          </div>
        </div>
        <SkillIntelligenceList skills={skillIntelligence} reports={evidenceReports} />
      </SectionReveal>

      {/* ═══ PROOF BEHIND YOUR SKILLS ═══ */}
      <SectionReveal className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">📊 Proof Behind Your Skills</h2>
            <p className="text-sm text-slate-500 mt-1">
              {evidence.length > 0 
                ? `${evidence.length} evidence records found in your portfolio.` 
                : 'How your skills are supported by real portfolio data.'
              }
            </p>
          </div>
          <Button
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => { void handleBuildEvidence(); }}
            disabled={isBuildingEvidence || !portfolioData}
            className="h-9 px-4 border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
          >
            {isBuildingEvidence ? 'Syncing…' : evidence.length > 0 ? '↻ Rebuild Evidence' : 'Build Evidence'}
          </Button>
        </div>
        
        <StatusBanner visible={!!evidenceError}>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{evidenceError}</div>
        </StatusBanner>
        
        <SkillEvidenceList evidence={evidence} />
      </SectionReveal>

      {/* ═══ STRENGTHS & GAPS ═══ */}
      <div className="grid gap-8 lg:grid-cols-2">
        <SectionReveal className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">💪 Your Strengths</h2>
          <CareerStrengths strengths={strengths} />
        </SectionReveal>

        <SectionReveal className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">🎯 Your Career Gaps</h2>
          <CareerGaps analysis={gapAnalysis} />
        </SectionReveal>
      </div>

      {/* ═══ PROJECT JOURNEY ═══ */}
      {gapAnalysis.targetRole && gapAnalysis.gaps.length > 0 && (
        <SectionReveal>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">🗺 CareerProof Project Journey</CardTitle>
              <p className="text-xs text-slate-500">From career gap to new evidence — the unique CareerProof workflow.</p>
            </CardHeader>
            <CardContent>
              <StaggerList className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-0">
                {[
                  { label: 'Career Gap', icon: '🎯', active: gapAnalysis.gaps.length > 0 },
                  { label: 'Recommendation', icon: '✨', active: (structuredRecs?.length ?? 0) > 0 },
                  { label: 'Project Idea', icon: '💡', active: (projectIdeas?.length ?? 0) > 0 },
                  { label: 'Blueprint', icon: '🏗', active: !!blueprint },
                  { label: 'Roadmap', icon: '📋', active: !!roadmap },
                  { label: 'Evidence', icon: '📈', active: false },
                ].map((step, i) => (
                  <StaggerItem key={step.label}>
                    <div className="flex items-center sm:flex-1">
                    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${step.active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                      <span className="text-sm">{step.icon}</span>
                      <span className={`text-xs font-medium ${step.active ? 'text-indigo-700' : 'text-slate-400'}`}>{step.label}</span>
                    </div>
                    {i < 5 && <span className="mx-1 text-slate-300 sm:mx-2">→</span>}
                  </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </CardContent>
          </Card>
        </SectionReveal>
      )}

      {/* ═══ NEXT BEST ACTION ═══ */}
      {gapAnalysis.gaps.length > 0 && projectIdeas && projectIdeas.length > 0 && (
        <SectionReveal>
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-base">🚀 Your Next Best Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">{projectIdeas[0].title}</h3>
                <p className="text-sm text-slate-600">{projectIdeas[0].whyThisProject}</p>
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-700">Evidence you can create:</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {projectIdeas[0].evidenceToCreate.map((ev, i) => (
                      <span key={i} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setSelectedIdea(projectIdeas[0])} disabled={!!selectedIdea}>
                    View Project
                  </Button>
                  {selectedIdea && blueprint && (
                    <Button size="sm" variant="outline" onClick={() => { /* scroll handled by rendering */ }}>
                      View Blueprint
                    </Button>
                  )}
                  {selectedIdea && blueprint && roadmap && (
                    <Button size="sm" variant="outline">
                      View Roadmap
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionReveal>
      )}

      {/* ═══ AI CAREER RECOMMENDATIONS ═══ */}
      <SectionReveal className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">✨ AI Career Recommendations</h2>
            <p className="text-sm text-slate-500 mt-1">Personalized suggestions based on your evidence and career gaps.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { void handleGenerateRecommendations(); }}
            disabled={isGeneratingRecs || !recInput}
            className="h-9 px-4 border-indigo-100 text-indigo-700 hover:bg-indigo-50"
          >
            {isGeneratingRecs ? '✨ Analyzing…' : structuredRecs ? '✨ Regenerate' : '✨ Get Recommendations'}
          </Button>
        </div>

        {recsError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{recsError}</div>}
        
        {isGeneratingRecs ? (
          <div className="flex flex-col items-center gap-3 py-12 rounded-2xl border border-dashed border-indigo-100 bg-indigo-50/20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Analyzing career trajectory...</p>
          </div>
        ) : (
          <RecommendationList recommendations={structuredRecs || []} />
        )}
      </SectionReveal>

      {/* ═══ PROJECT EXPLORER ═══ */}
      <SectionReveal className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">🚀 Project Explorer</h2>
          <p className="text-sm text-slate-500">Master new skills by building production-grade projects tailored to your goals.</p>
        </div>
        <ProjectExplorer 
          ideas={projectIdeas || []}
          selectedIdea={selectedIdea}
          onSelectIdea={(idea) => {
            setSelectedIdea(idea);
            setBlueprint(null);
            setBlueprintError(null);
            setRoadmap(null);
            setRoadmapError(null);
            setDocsPack(null);
            setDocsPackError(null);
          }}
          isGeneratingIdeas={isGeneratingIdeas}
          onGenerateIdeas={handleGenerateProjectIdeas}
          targetRole={gapAnalysis.targetRole}
          blueprint={blueprint}
          isGeneratingBlueprint={isGeneratingBlueprint}
          onGenerateBlueprint={handleGenerateBlueprint}
          roadmap={roadmap}
          isGeneratingRoadmap={isGeneratingRoadmap}
          onGenerateRoadmap={handleGenerateRoadmap}
          docsPack={docsPack}
          isGeneratingDocsPack={isGeneratingDocsPack}
          onGenerateDocsPack={handleGenerateDocsPack}
          gaps={gapAnalysis.gaps.length}
        />
      </SectionReveal>

      {/* ═══ JOB DESCRIPTION ANALYZER ═══ */}
      <JobDescriptionAnalyzer skillIntelligence={skillIntelligence} evidence={evidence} targetRole={profile.targetRole ?? ''} />

      {/* ═══ CAREER PROFILE EDITOR ═══ */}
      <SectionReveal className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Career Profile</h2>
            <p className="text-xs text-slate-500">Career-specific fields that supplement your portfolio.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { void handleSave(); }} disabled={isSaving} size="sm">
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        <Card className="mt-4 border-slate-200">
          <CardContent className="space-y-4 pt-6">
            <CollapsibleSection title="GitHub Integration" open={expandedSection === 'github'} onToggle={() => toggleSection('github')}>
              <div className="space-y-4">
                {profile.githubConnection?.isConnected ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <span className="text-sm font-medium text-emerald-800">Connected as {profile.githubConnection.username}</span>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const idToken = await user?.getIdToken();
                        if (!idToken) return;
                        const res = await fetch('/api/auth/github/disconnect', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${idToken}` },
                        });
                        if (res.ok) {
                          updateField('githubConnection', { isConnected: false, username: undefined, githubId: undefined });
                        }
                      } catch (err) {
                        console.error('GitHub disconnect error:', err);
                      }
                    }}>Disconnect</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">Not connected to GitHub</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!user?.uid) return;
                        try {
                          const idToken = await user.getIdToken();
                          const res = await fetch('/api/auth/github/start', {
                            headers: { 'Authorization': `Bearer ${idToken}` },
                          });
                          if (!res.ok) throw new Error('Failed to start GitHub OAuth');
                          const { url } = await res.json();
                          window.location.href = url;
                        } catch (err) {
                          console.error('GitHub OAuth start error:', err);
                        }
                      }}
                    >
                      Connect GitHub
                    </Button>
                  </div>
                )}
                <p className="text-xs text-slate-400">Connecting allows CareerProof to analyze your GitHub repositories for evidence.</p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Target Role" open={expandedSection === 'target-role'} onToggle={() => toggleSection('target-role')}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {['Frontend Developer', 'Full-Stack Developer', 'Backend Developer', 'AI Engineer', 'Custom Role'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        updateField('targetRole', role);
                        updateField('targetRoleType', role === 'Custom Role' ? 'custom' : 'fixed');
                        // Sync targetRoles so the role appears in the comma-separated list
                        if (role !== 'Custom Role' && !profile.targetRoles.includes(role)) {
                          updateField('targetRoles', [...profile.targetRoles, role]);
                        }
                      }}
                      className={`rounded-lg border p-3 text-left text-sm font-medium transition ${
                        profile.targetRole === role
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                {profile.targetRoleType === 'custom' && (
                  <Input placeholder="Enter custom role title" value={profile.targetRole} onChange={(e) => updateField('targetRole', e.target.value)} />
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Professional Info" open={expandedSection === 'career-info'} onToggle={() => toggleSection('career-info')}>
              <div className="space-y-2">
                <Input placeholder="Professional Title" value={profile.professionalTitle} onChange={(e) => updateField('professionalTitle', e.target.value)} />
                <Textarea rows={4} placeholder="Career Summary" value={profile.careerSummary} onChange={(e) => updateField('careerSummary', e.target.value)} />
                <Input placeholder="Career Interests (comma separated)" value={profile.careerInterests.join(', ')} onChange={(e) => updateField('careerInterests', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
                <Input placeholder="Target Roles (comma separated)" value={profile.targetRoles.join(', ')} onChange={(e) => updateField('targetRoles', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
                <Input placeholder="Languages (comma separated)" value={profile.languages.join(', ')} onChange={(e) => updateField('languages', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Online Presence" open={expandedSection === 'online'} onToggle={() => toggleSection('online')}>
              <div className="space-y-2">
                <Input placeholder="GitHub URL" value={profile.githubUrl} onChange={(e) => updateField('githubUrl', e.target.value)} />
                <Input placeholder="LinkedIn URL" value={profile.linkedinUrl} onChange={(e) => updateField('linkedinUrl', e.target.value)} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={`Certifications (${profile.certifications.length})`} open={expandedSection === 'certifications'} onToggle={() => toggleSection('certifications')}>
              <div className="space-y-3">
                {profile.certifications.length === 0 && <p className="text-sm text-slate-500">No certifications yet.</p>}
                {profile.certifications.map((cert, index) => (
                  <div key={cert.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Certification {index + 1}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeCertification(index)} className="text-xs text-slate-400">Remove</Button>
                    </div>
                    <Input placeholder="Name" value={cert.name} onChange={(e) => updateCertification(index, { name: e.target.value })} />
                    <Input placeholder="Issuer" value={cert.issuer ?? ''} onChange={(e) => updateCertification(index, { issuer: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Date" value={cert.date ?? ''} onChange={(e) => updateCertification(index, { date: e.target.value })} />
                      <Input placeholder="URL" value={cert.url ?? ''} onChange={(e) => updateCertification(index, { url: e.target.value })} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addCertification}>+ Add Certification</Button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={`Achievements (${profile.achievements.length})`} open={expandedSection === 'achievements'} onToggle={() => toggleSection('achievements')}>
              <div className="space-y-3">
                {profile.achievements.length === 0 && <p className="text-sm text-slate-500">No achievements yet.</p>}
                {profile.achievements.map((ach, index) => (
                  <div key={ach.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Achievement {index + 1}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeAchievement(index)} className="text-xs text-slate-400">Remove</Button>
                    </div>
                    <Input placeholder="Title" value={ach.title} onChange={(e) => updateAchievement(index, { title: e.target.value })} />
                    <Input placeholder="Description" value={ach.description ?? ''} onChange={(e) => updateAchievement(index, { description: e.target.value })} />
                    <Input placeholder="Date" value={ach.date ?? ''} onChange={(e) => updateAchievement(index, { date: e.target.value })} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAchievement}>+ Add Achievement</Button>
              </div>
            </CollapsibleSection>
          </CardContent>
        </Card>
      </SectionReveal>
    </PageTransition>
  );
}

  // ── Helper functions ──────────────────────────────────────────────

function getSkillGroups(evidence: CareerEvidence[]) {
  const map = new Map<string, { skill: string; items: CareerEvidence[]; bestStrength: CareerEvidence['evidenceStrength'] }>();
  const strengthOrder: Record<CareerEvidence['evidenceStrength'], number> = { strong: 3, moderate: 2, weak: 1 };
  for (const ev of evidence) {
    const key = ev.skill.toLowerCase();
    const existing = map.get(key);
    if (existing) { existing.items.push(ev); if (strengthOrder[ev.evidenceStrength] > strengthOrder[existing.bestStrength]) existing.bestStrength = ev.evidenceStrength; }
    else map.set(key, { skill: ev.skill, items: [ev], bestStrength: ev.evidenceStrength });
  }
  return Array.from(map.values()).sort((a, b) => {
    const diff = strengthOrder[b.bestStrength] - strengthOrder[a.bestStrength];
    return diff !== 0 ? diff : b.items.length - a.items.length;
  });
}
