'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { CareerProfile, CareerEvidence } from '@/types/career';
import type { Portfolio } from '@/types/portfolio';
import { PageTransition, SectionReveal, HoverScale } from '@/lib/motion';
import { motion } from 'motion/react';
import { CareerJourney, SkillEvidenceList } from '@/components/career';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicCareerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [evidence, setEvidence] = useState<CareerEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { id } = await params;
      if (!db || !isFirebaseConfigured) {
        setError('Configuration error.');
        setLoading(false);
        return;
      }

      try {
        const profileSnap = await getDoc(doc(db, 'careerProfiles', id));
        if (!profileSnap.exists()) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }
        const profileData = profileSnap.data() as CareerProfile;

        // Client-side isPublic check for clear UX (Firestore rules also enforce this)
        if (!profileData.isPublic) {
          setError('This career profile is private.');
          setLoading(false);
          return;
        }

        // Fetch related data
        const portfoliosSnap = await getDocs(query(collection(db, 'portfolios'), where('userId', '==', profileData.userId)));
        const publicPortfolio = portfoliosSnap.docs.find(d => d.data().isPublic);
        
        if (!publicPortfolio) {
            setError('This portfolio is private.');
            setLoading(false);
            return;
        }
        
        setPortfolio(publicPortfolio.data() as Portfolio);
        setProfile(profileData);

        // Evidence requires authentication per Firestore rules.
        // Try fetching but gracefully handle permission errors for unauthenticated viewers.
        try {
          const evidenceSnap = await getDocs(query(collection(db, 'careerEvidence'), where('userId', '==', profileData.userId), where('sourceType', '==', 'github')));
          setEvidence(evidenceSnap.docs.map(d => d.data() as CareerEvidence));
        } catch {
          // Unauthenticated users cannot read evidence — that's expected, show profile without evidence.
          setEvidence([]);
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('permission') || msg.includes('denied')) {
          setError('This profile is private or does not exist.');
        } else {
          setError('Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [params]);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading career profile...</div>;
  if (error || !profile) return <div className="p-10 text-center text-red-600">{error}</div>;

  return (
    <PageTransition className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        <SectionReveal>
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100"
          >
            <h1 className="text-3xl font-bold text-slate-900">{profile.professionalTitle}</h1>
            <p className="mt-2 text-slate-600">{profile.careerSummary}</p>
          </motion.header>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <HoverScale>
            <Card>
              <CardHeader><CardTitle>Career Journey</CardTitle></CardHeader>
              <CardContent><CareerJourney steps={profile.achievements.map((a, i) => ({ label: a.title, icon: '📅', active: i === profile.achievements.length - 1 }))} /></CardContent>
            </Card>
          </HoverScale>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <HoverScale>
            <Card>
                <CardHeader><CardTitle>GitHub Evidence</CardTitle></CardHeader>
                <CardContent>
                    <SkillEvidenceList evidence={evidence} />
                </CardContent>
            </Card>
          </HoverScale>
        </SectionReveal>
      </div>
    </PageTransition>
  );
}
