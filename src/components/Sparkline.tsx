/** Minimal trend line: ink stroke on paper, gold dot on the latest reading. */
export default function Sparkline({ values }: { values: number[] }) {
  const w = 280
  const h = 44
  const pad = 4
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2)
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values[values.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-11 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ink/30"
      />
      <circle cx={x(values.length - 1)} cy={y(last)} r="3" className="fill-gold" />
    </svg>
  )
}
