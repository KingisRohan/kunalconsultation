import { useEffect, useState } from 'react'
import { checkIn, getAttendance } from '../lib/data'
import { isDemoMode } from '../lib/config'
import { demoDeskCode } from '../lib/demo'
import type { Member } from '../lib/types'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Native check-in, the app-side attendance source. Shown to every tier. */
export default function CheckInCard({ member }: { member: Member }) {
  const [checkedIn, setCheckedIn] = useState<boolean | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoCode, setDemoCode] = useState('')

  useEffect(() => {
    void getAttendance(member).then((days) => setCheckedIn(days[0]?.date === todayLocal()))
    if (isDemoMode) void demoDeskCode().then(setDemoCode)
  }, [member])

  async function handleCheckIn() {
    setBusy(true)
    setError('')
    const result = await checkIn(member, code)
    setBusy(false)
    if (result.ok) {
      setCheckedIn(true)
      setCode('')
    } else {
      setError(result.error)
    }
  }

  if (checkedIn === null) return null

  return (
    <section className="pb-6">
      <article className="border border-ink/10 p-5">
        <h2 className="font-headline text-sm tracking-[0.2em] text-muted">AT THE CLUB</h2>
        {checkedIn ? (
          <p className="mt-2 font-headline text-sm text-gold">Marked present for today.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              Scan the desk QR, or enter the code printed beside it.
            </p>
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Desk code"
                autoComplete="off"
                className="w-full border-b border-ink/20 bg-transparent pb-2 tracking-widest outline-none"
              />
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={busy || code.trim().length === 0}
                className="shrink-0 bg-crimson px-5 py-2 font-headline text-xs tracking-[0.2em] text-paper disabled:opacity-40"
              >
                {busy ? 'ONE MOMENT' : 'CHECK IN'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-crimson">{error}</p>}
            {isDemoMode && demoCode && (
              <p className="mt-3 text-sm text-muted">
                Demo mode. Today’s desk code is {demoCode}. It rotates daily.
              </p>
            )}
          </>
        )}
      </article>
    </section>
  )
}
