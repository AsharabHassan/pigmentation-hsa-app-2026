// A stylised preview of the analysis report for the landing-page hero. Pure
// SVG + CSS (no photo of a real person, no client JS) and clearly labelled as a
// sample, so it sets expectations without implying anyone's actual result.

const ZONES = [
  { label: "Forehead", value: 55, x: 100, y: 62 },
  { label: "Under-eye", value: 38, x: 68, y: 104 },
  { label: "Nose", value: 24, x: 100, y: 124 },
  { label: "Cheeks", value: 72, x: 140, y: 132 },
  { label: "Upper lip", value: 46, x: 100, y: 158 },
  { label: "Jawline", value: 31, x: 66, y: 180 },
] as const;

export function SampleReportMock() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[300px] rounded-[2.4rem] border border-peach/30 bg-gradient-to-b from-[#16130f] to-[#090909] p-4 shadow-[0_40px_120px_-40px_rgba(212,175,55,0.65)]"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-peach">
          Your pigmentation map
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-body/70">
          Sample
        </span>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50">
        <svg viewBox="0 0 200 240" className="block w-full">
          <defs>
            <radialGradient id="lp-glow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="240" fill="url(#lp-glow)" />
          {/* abstract face outline + mesh */}
          <path
            d="M100 24c34 0 56 26 56 66 0 22-5 42-14 60-10 20-24 40-42 40s-32-20-42-40c-9-18-14-38-14-60 0-40 22-66 56-66z"
            fill="none"
            stroke="#d4af37"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />
          <g stroke="#d4af37" strokeOpacity="0.16" strokeWidth="0.6" fill="none">
            <path d="M46 96h108M50 128h100M60 160h80M100 26v164M72 40l-18 90 30 56M128 40l18 90-30 56M58 96l42 32 42-32M60 160l40-32 40 32" />
          </g>
          {ZONES.map((zone) => (
            <g key={zone.label}>
              <circle
                cx={zone.x}
                cy={zone.y}
                r={4 + zone.value / 9}
                fill="#d4af37"
                fillOpacity={0.12 + zone.value / 260}
              />
              <circle cx={zone.x} cy={zone.y} r="2.2" fill="#e7c668" />
            </g>
          ))}
        </svg>
        <div className="lp-scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-peach/25 to-transparent" />
      </div>

      <ul className="mt-3 space-y-1.5 px-1">
        {ZONES.filter((zone) => zone.value >= 45).map((zone) => (
          <li key={zone.label} className="flex items-center gap-2">
            <span className="w-16 text-[10px] font-medium text-heading">
              {zone.label}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-peach-deep to-peach-light"
                style={{ width: `${zone.value}%` }}
              />
            </span>
            <span className="w-6 text-right text-[10px] tabular-nums text-peach">
              {zone.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
