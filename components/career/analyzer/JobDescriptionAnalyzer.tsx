import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SectionReveal, StaggerList, StaggerItem, HoverScale } from '@/lib/motion';
import { motion } from 'motion/react';
import { analyzeJobDescription, type JobDescriptionAnalysis } from '@/lib/gemini';
import { useAuth } from '@/hooks/useAuth';
import type { DerivedSkillIntelligence, CareerEvidence } from '@/types/career';

interface JobDescriptionAnalyzerProps {
  skillIntelligence: DerivedSkillIntelligence[];
  evidence: CareerEvidence[];
  targetRole: string;
}

export function JobDescriptionAnalyzer({ skillIntelligence, evidence, targetRole }: JobDescriptionAnalyzerProps) {
  const { user } = useAuth();
  const [jdText, setJdText] = useState('');
  const [analysis, setAnalysis] = useState<JobDescriptionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeJobDescription({
        jobDescriptionText: jdText,
        userSkills: skillIntelligence.map(si => si.name),
        targetRole,
      }, await user?.getIdToken());
      if (result.data) setAnalysis(result.data);
      else setError(result.error ?? 'Failed to analyze job description.');
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setJdText(''); setAnalysis(null); setError(null); };

  return (
    <SectionReveal>
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Job Description Analyzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={jdText} 
            onChange={(e) => setJdText(e.target.value)} 
            placeholder="Paste the job description here to see how well it matches your career profile..." 
            rows={8} 
            className="w-full"
          />
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={loading || !jdText.trim()}>
              {loading ? 'Analyzing...' : 'Analyze Job Description'}
            </Button>
            <Button variant="outline" onClick={clear}>Clear</Button>
          </div>
          
          {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 space-y-6"
            >
              <HoverScale>
                <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-6">
                  <div>
                    <div className="text-sm font-semibold text-indigo-900">Overall Match</div>
                    <div className="text-3xl font-extrabold text-indigo-700">{analysis.matchPercentage}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-indigo-900">Evidence Coverage</div>
                    <div className="text-3xl font-extrabold text-indigo-700">{analysis.evidenceCoverage}%</div>
                  </div>
                </div>
              </HoverScale>

              <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StaggerItem>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <h4 className="text-xs font-bold uppercase text-emerald-800">Matched</h4>
                    <div className="text-2xl font-bold text-emerald-700">{analysis.matchedSkills.length}</div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <h4 className="text-xs font-bold uppercase text-amber-800">Developing</h4>
                    <div className="text-2xl font-bold text-amber-700">{analysis.developingSkills.length}</div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <h4 className="text-xs font-bold uppercase text-red-800">Missing</h4>
                    <div className="text-2xl font-bold text-red-700">{analysis.missingSkills.length}</div>
                  </div>
                </StaggerItem>
              </StaggerList>

              {analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommended Next Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                    {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </SectionReveal>
  );
}
