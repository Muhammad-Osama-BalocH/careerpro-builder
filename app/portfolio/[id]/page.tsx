'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { resolveTemplate } from '@/components/templates/registry';
import type { Portfolio } from '@/types/portfolio';
import { PageTransition, SectionReveal, PressScale, HoverScale } from '@/lib/motion';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function PublicPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      const resolvedParams = await params;

      if (!db || !isFirebaseConfigured) {
        setError('Firebase is not configured yet. Add your Firebase credentials to view this portfolio.');
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'portfolios', resolvedParams.id));
        if (snapshot.exists()) {
          const data = snapshot.data() as Portfolio;
          // Enforce isPublic: private portfolios are not viewable by the public.
          // (Firestore rules also enforce this server-side, but we check here for a clear UX message.)
          if (!data.isPublic) {
            setError('This portfolio is private and cannot be viewed publicly.');
          } else {
            setPortfolio(data);
          }
        } else {
          setError('Portfolio not found.');
        }
      } catch (err) {
        // Firestore rules will reject reads on private portfolios for non-owners.
        const message = err instanceof Error ? err.message : 'Failed to load portfolio';
        if (message.includes('permission') || message.includes('denied')) {
          setError('This portfolio is private or does not exist.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchPortfolio();
  }, [params]);

  const renderTemplate = useMemo(() => {
    if (!portfolio) return null;
    const entry = resolveTemplate(portfolio.template || 'minimal');
    const Template = entry.component;
    return <Template portfolio={portfolio} />;
  }, [portfolio]);

  async function handleExportPdf() {
    if (!pageRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(pageRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${portfolio?.name || 'portfolio'}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading portfolio...</div>;
  }

  if (error || !portfolio) {
    return <div className="p-10 text-center text-red-600">{error ?? 'Portfolio unavailable.'}</div>;
  }

  return (
    <PageTransition className="min-h-screen overflow-x-hidden bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4 flex justify-end"
        >
          <PressScale>
            <Button onClick={() => { void handleExportPdf(); }} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </PressScale>
        </motion.div>
        <SectionReveal>
          <HoverScale>
            <div ref={pageRef} className="overflow-hidden rounded-2xl bg-white shadow-xl">
              {renderTemplate}
            </div>
          </HoverScale>
        </SectionReveal>
      </div>
    </PageTransition>
  );
}
