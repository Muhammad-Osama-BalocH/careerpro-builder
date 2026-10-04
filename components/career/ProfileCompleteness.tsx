'use client';

import type { ProfileCompletenessResult } from '@/lib/careerScoring';
import { Button } from '@/components/ui/button';

export function ProfileCompleteness({ result }: { result: ProfileCompletenessResult }) {
  const missing = result.areas.filter((a) => !a.complete);
  const barColor = result.score >= 80 ? 'bg-green-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-orange-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">Profile Completeness</span>
        <span className="text-sm font-semibold text-slate-600">{result.score}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-2.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.max(result.score, 2)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {result.completed} / {result.total} areas completed
      </p>

      {missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600">Missing:</p>
          {missing.map((a) => (
            <div key={a.label} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
              {a.label}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-2" asChild>
            <a href="/builder">Complete Profile</a>
          </Button>
        </div>
      )}
    </div>
  );
}
