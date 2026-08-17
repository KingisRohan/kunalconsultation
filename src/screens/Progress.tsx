import { useEffect, useState } from 'react'
import Sparkline from '../components/Sparkline'
import { getAttendance, getBiometrics } from '../lib/data'
import { TIERS } from '../lib/tiers'
import { useMember } from '../lib/member-context'
import type { AttendanceDay, BiometricReading } from '../lib/types'

const METRICS = [
  { key: 'weightKg', label: 'WEIGHT', unit: 'kg' },
  { key: 'bodyFatPct', label: 'BODY FAT', unit: '%' },
  { key: 'muscleKg', label: 'MUSCLE', unit: 'kg' },
] as const

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function lastVisitLine(days: AttendanceDay[]): string {
  if (days.length === 0) return 'No visits recorded yet.'
  const gap = Math.round(
    (new Date(localDate(new Date())).getTime() - new Date(days[0].date).getTime()) / 86_400_000,
  )
  if (gap === 0) return 'Last visit today.'
  if (gap === 1) return 'Last visit yesterday.'
  return `Last visit ${gap} days ago.`
}

export default function Progress() {
  const { member } = useMember()
  const [readings, setReadings] = useState<BiometricReading[] | null>(null)
  const [attendance, setAttendance] = useState<AttendanceDay[]>([])

  const included = member ? TIERS[member.tier].rank >= TIERS.warrior.rank : false

  useEffect(() => {
    if (member && included) {
      void getBiometrics(member).then(setReadings)
      void getAttendance(member).then(setAttendance)
    }
  }, [member, included])

  if (!member) return null

  const latest = readings?.[readings.length - 1]

  return (
    <div className="text-ink">
      <header className="safe-top bg-ink px-6 pb-8 text-paper">
        <h1 className="pt-4 font-headline text-3xl">Progress</h1>
        <p className="mt-2 font-editorial text-lg italic text-paper/70">
          The record of hours kept.
        </p>
      </header>

      <main className="px-6 py-6">
        {!included ? (
          <p className="text-muted">
            Progress tracking joins your membership at Warrior. Ask at the front desk.
          </p>
        ) : readings === null ? null : readings.length === 0 ? (
          <p className="text-muted">
            No readings yet. Ask staff to record your first at the desk.
          </p>
        ) : (
          <>
            {(() => {
              const today = new Date(localDate(new Date()))
              const visited = new Set(attendance.map((a) => a.date))
              const last30 = attendance.filter(
                (a) => (today.getTime() - new Date(a.date).getTime()) / 86_400_000 < 30,
              ).length
              const strip = Array.from({ length: 28 }, (_, i) =>
                visited.has(localDate(new Date(today.getTime() - (27 - i) * 86_400_000))),
              )
              return (
                <article className="mb-4 border border-ink/10 p-5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
                      ATTENDANCE
                    </h2>
                    <p className="text-xs text-muted">{lastVisitLine(attendance)}</p>
                  </div>
                  <p className="mt-2 font-headline text-3xl text-gold">
                    {last30}
                    <span className="text-lg text-muted"> visits in thirty days</span>
                  </p>
                  {/* Four weeks, oldest first. A thinning row is the churn signal. */}
                  <div className="mt-3 grid grid-cols-14 gap-1">
                    {strip.map((on, i) => (
                      <span
                        key={i}
                        className={'h-2 w-full ' + (on ? 'bg-ink/70' : 'border border-ink/15')}
                      />
                    ))}
                  </div>
                </article>
              )
            })()}
            <div className="space-y-4">
              {METRICS.map((metric) => {
                const series = readings
                  .map((r) => ({ on: r.recordedOn, value: r[metric.key] }))
                  .filter((p): p is { on: string; value: number } => p.value !== null)
                if (series.length === 0) return null
                const first = series[0]
                const last = series[series.length - 1]
                const delta = Number((last.value - first.value).toFixed(1))
                const deltaText =
                  delta === 0 ? 'steady' : `${delta > 0 ? '+' : '-'}${Math.abs(delta)} ${metric.unit}`
                return (
                  <article key={metric.key} className="border border-ink/10 p-5">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
                        {metric.label}
                      </h2>
                      <p className="text-xs text-muted">
                        {deltaText} since {formatDate(first.on)}
                      </p>
                    </div>
                    <p className="mt-2 font-headline text-3xl text-gold">
                      {last.value}
                      <span className="text-lg text-muted"> {metric.unit}</span>
                    </p>
                    <Sparkline values={series.map((p) => p.value)} />
                  </article>
                )
              })}
            </div>
            {latest && (
              <p className="mt-6 text-sm text-muted">
                Latest reading {formatDate(latest.recordedOn)},{' '}
                {latest.source === 'crm' ? 'from the club system' : 'recorded by staff'}. New
                readings are taken at the desk.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
