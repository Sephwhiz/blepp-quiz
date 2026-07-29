'use client'
import { useRouter } from 'next/navigation'
import { getModuleScore, getAllScores } from '../lib/scoreStorage' // ✅ ADDED getAllScores
import { calculatePRCRating } from '../lib/prcRating'
import ModuleAggregateBadge from '../components/ModuleAggregateBadge'

type Counts = { abpsy: number; devpsy: number; iopsy: number; psyas: number }

const TIERS: {
  key: string
  label: string
  tag: string
  panelBorder: string
  tierText: string
  tierChip: string
  cardHover: string
  cardBar: string
  cardArrow: string
  cardMeta: string
  counts: Counts
}[] = [
  {
    key: 'easy', label: 'Easy', tag: 'Foundation',
    panelBorder: 'border-emerald-500/25', tierText: 'text-emerald-300',
    tierChip: 'bg-emerald-400/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/30',
    cardHover: 'hover:border-emerald-400/60 hover:bg-emerald-500/5',
    cardBar: 'bg-emerald-400', cardArrow: 'text-emerald-300', cardMeta: 'text-emerald-200/70',
    counts: { abpsy: 100, devpsy: 100, iopsy: 100, psyas: 130 },
  },
  {
    key: 'medium', label: 'Medium', tag: 'Application',
    panelBorder: 'border-sky-500/25', tierText: 'text-sky-300',
    tierChip: 'bg-sky-400/10 text-sky-200 ring-1 ring-inset ring-sky-400/30',
    cardHover: 'hover:border-sky-400/60 hover:bg-sky-500/5',
    cardBar: 'bg-sky-400', cardArrow: 'text-sky-300', cardMeta: 'text-sky-200/70',
    counts: { abpsy: 100, devpsy: 100, iopsy: 100, psyas: 130 },
  },
  {
    key: 'hard', label: 'Hard', tag: 'Analysis',
    panelBorder: 'border-amber-500/25', tierText: 'text-amber-300',
    tierChip: 'bg-amber-400/10 text-amber-200 ring-1 ring-inset ring-amber-400/30',
    cardHover: 'hover:border-amber-400/60 hover:bg-amber-500/5',
    cardBar: 'bg-amber-400', cardArrow: 'text-amber-300', cardMeta: 'text-amber-200/70',
    counts: { abpsy: 100, devpsy: 100, iopsy: 100, psyas: 130 },
  },
  {
    key: 'mockboard', label: 'Mock Board Exam', tag: 'Full simulation',
    panelBorder: 'border-rose-500/25', tierText: 'text-rose-300',
    tierChip: 'bg-rose-400/10 text-rose-200 ring-1 ring-inset ring-rose-400/30',
    cardHover: 'hover:border-rose-400/60 hover:bg-rose-500/5',
    cardBar: 'bg-rose-400', cardArrow: 'text-rose-300', cardMeta: 'text-rose-200/70',
    counts: { abpsy: 100, devpsy: 100, iopsy: 100, psyas: 100 },
  },
]

const DOMAINS = [
  { code: 'abpsy', label: 'Abnormal Psychology', short: 'ABPSY' },
  { code: 'devpsy', label: 'Developmental Psychology', short: 'DEVPSY' },
  { code: 'iopsy', label: 'Industrial / Organizational', short: 'IOPSY' },
  { code: 'psyas', label: 'Psychological Assessment', short: 'PSYAS' },
] as const

// ✅ INLINE BADGE COMPONENT
const ScoreBadge = ({ rating, score, total }: { rating: number; score: number; total: number }) => {
  const color = rating >= 8 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20' : 
                rating >= 6 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20' : 
                'text-red-400 border-red-500/30 bg-red-900/20';
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${color}`}>
      <span>#{rating}</span>
      <span className="opacity-75">({score}/{total})</span>
    </div>
  );
};

export default function PreboardMenu() {
  const router = useRouter()

  const startPart = (tierKey: string, code: string) => {
    const file = `preboard-${tierKey}-${code}.json`
    router.push(`/quiz?file=${encodeURIComponent(file)}&module=preboard_edition`)
  }

  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

  return (
    <>
      <style>{`
        @keyframes pbReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .pb-reveal { opacity: 0; animation: pbReveal .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) { .pb-reveal { animation: none; opacity: 1; } }
      `}</style>

      {/* layered ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gray-950">
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-amber-500/[0.06] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative min-h-screen px-5 pb-16 pt-24 sm:px-8 sm:pt-16">
        <button
          onClick={() => router.push('/modules')}
          className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white shadow-lg transition hover:bg-gray-700"
        >
          ← Back to Modules
        </button>

        <div className="mx-auto max-w-5xl">
          {/* header */}
          <header className="pb-reveal mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-400/80">
              Exam Simulation
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Preboard
              <span className="ml-3 inline-block h-3 w-12 -translate-y-1 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 align-middle" />
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-400 sm:text-base">
              Four difficulty tiers across all four domains — every item paired with a full
              rationale. Pick a tier, pick a subject, drill.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-gray-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">4 tiers</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">4 domains</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">rationales included</span>
            </div>
          </header>

          {/* AGGREGATE RATING BADGE */}
          <div className="pt-6 pb-8 flex justify-center">
            <ModuleAggregateBadge 
              moduleIdPrefix="preboard_" 
              label="Preboard Rating"
            />
          </div>

          {/* tier panels */}
          <div className="space-y-6">
            {TIERS.map((t, ti) => (
              <section
                key={t.key}
                className={`pb-reveal rounded-2xl border ${t.panelBorder} bg-gray-900/40 p-5 backdrop-blur-sm sm:p-6`}
                style={{ animationDelay: `${120 + ti * 90}ms` }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-black ${t.tierChip}`}>
                      {ti + 1}
                    </span>
                    <div>
                      <h2 className={`text-lg font-bold ${t.tierText}`}>{t.label}</h2>
                      <p className="text-[11px] uppercase tracking-wider text-gray-500">{t.tag}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${t.tierChip}`}>
                    4 subjects
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {DOMAINS.map((d) => {
                    // ✅ LOOKUP SCORE FOR THIS DOMAIN/TIER COMBO
                    const partKey = `preboard_${t.key}_${d.code}`;
                    const partScore = allScores[partKey];

                    return (
                      <button
                        key={d.code}
                        onClick={() => startPart(t.key, d.code)}
                        className={`group relative overflow-hidden rounded-xl border border-white/5 bg-gray-950/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${t.cardHover}`}
                      >
                        <span
                          className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-50 transition-all duration-200 group-hover:top-0 group-hover:bottom-0 group-hover:opacity-100 ${t.cardBar}`}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-gray-500">
                            {d.short}
                          </span>
                          <span className={`text-[10px] font-semibold ${t.cardMeta}`}>
                            {t.counts[d.code]} Q
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-snug text-white">{d.label}</p>
                        
                        {/* ✅ SCORE BADGE OR PLACEHOLDER */}
                        {partScore ? (
                          <div className="mt-3">
                            <ScoreBadge rating={partScore.rating} score={partScore.score} total={partScore.totalQuestions} />
                          </div>
                        ) : (
                          <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${t.cardArrow}`}>
                            <span>Start drill</span>
                            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </> // ✅ FIXED: Removed extra closing div from original code
  )
}