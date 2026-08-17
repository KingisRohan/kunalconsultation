import { useCallback, useEffect, useState } from 'react'
import { claimEventPass, getEvents, getPassState, redeemPass } from '../lib/data'
import { toE164 } from '../lib/phone'
import { TIERS } from '../lib/tiers'
import { useMember } from '../lib/member-context'
import type { EventItem, PassState } from '../lib/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export default function Passes() {
  const { member } = useMember()
  const [state, setState] = useState<PassState | null>(null)
  const [friendName, setFriendName] = useState('')
  const [friendPhone, setFriendPhone] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventNote, setEventNote] = useState('')
  const [claimBusyId, setClaimBusyId] = useState('')

  const included = member ? TIERS[member.tier].rank >= TIERS.gladiator.rank : false
  const platinum = member?.tier === 'platinum'

  const load = useCallback(async () => {
    if (member) setState(await getPassState(member))
  }, [member])

  useEffect(() => {
    if (included) void load()
  }, [included, load])

  useEffect(() => {
    if (member && platinum) void getEvents(member).then(setEvents)
  }, [member, platinum])

  async function handleClaim(event: EventItem) {
    if (!member) return
    setClaimBusyId(event.id)
    setEventNote('')
    const result = await claimEventPass(member, event.id)
    setClaimBusyId('')
    if (result.ok) {
      setEventNote(`Pass claimed for ${event.title}. It sits under your name at the desk.`)
      setEvents(await getEvents(member))
    } else {
      setEventNote(result.error)
    }
  }

  async function handleRedeem() {
    if (!member || !state) return
    const phone = toE164(friendPhone)
    if (friendName.trim().length < 2) {
      setError('Enter your friend’s name.')
      return
    }
    if (!phone) {
      setError('Enter a valid mobile number for your friend.')
      return
    }
    setBusy(true)
    setError('')
    setConfirmation('')
    const result = await redeemPass(member, friendName.trim(), phone, honeypot)
    setBusy(false)
    if (result.ok) {
      setFriendName('')
      setFriendPhone('')
      setConfirmation('Pass redeemed. Your friend receives a WhatsApp welcome shortly.')
      await load()
    } else {
      setError(
        result.nextAvailableAt
          ? `${result.error} The next unlocks on ${formatDate(result.nextAvailableAt)}.`
          : result.error,
      )
    }
  }

  if (!member) return null

  const capReached = state ? state.used >= state.cap : false
  const windowBlocked = Boolean(state?.nextAvailableAt)
  const canRedeem = state ? !capReached && !windowBlocked : false

  return (
    <div className="text-ink">
      <header className="safe-top bg-ink px-6 pb-8 text-paper">
        <h1 className="pt-4 font-headline text-3xl">Passes</h1>
        <p className="mt-2 font-editorial text-lg italic text-paper/70">
          Bring a friend through the gates.
        </p>
      </header>

      <main className="px-6 py-6">
        {!included ? (
          <p className="text-muted">
            Friend passes join your membership at Gladiator. Ask at the front desk.
          </p>
        ) : !state ? null : (
          <>
            <article className="border border-ink/10 p-5">
              <h2 className="font-headline text-sm tracking-[0.2em] text-muted">YOUR PASSES</h2>
              <p className="mt-3 font-headline text-3xl text-gold">
                {state.cap - state.used}
                <span className="text-lg text-muted"> of {state.cap} left</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                One redeemable every seven days. Each guest is welcomed on WhatsApp.
              </p>
              {capReached && <p className="mt-3 text-sm text-muted">All ten passes are used.</p>}
              {windowBlocked && !capReached && (
                <p className="mt-3 text-sm text-muted">
                  One pass per seven days. The next unlocks on{' '}
                  {formatDate(state.nextAvailableAt!)}.
                </p>
              )}
            </article>

            {canRedeem && (
              <article className="mt-4 border border-ink/10 p-5">
                <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
                  REDEEM A PASS
                </h2>
                <label className="mt-4 block">
                  <span className="text-sm text-muted">Friend’s name</span>
                  <input
                    type="text"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    className="mt-1 w-full border-b border-ink/20 bg-transparent pb-2 outline-none"
                    autoComplete="off"
                  />
                </label>
                <label className="mt-5 block">
                  <span className="text-sm text-muted">Friend’s mobile number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={friendPhone}
                    onChange={(e) => setFriendPhone(e.target.value)}
                    className="mt-1 w-full border-b border-ink/20 bg-transparent pb-2 outline-none"
                    placeholder="9800000000"
                    autoComplete="off"
                  />
                </label>
                {/* Honeypot. Hidden from people, filled by bots, checked server side too. */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                />
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={busy}
                  className="mt-6 w-full bg-crimson py-4 font-headline text-sm tracking-[0.2em] text-paper disabled:opacity-40"
                >
                  {busy ? 'ONE MOMENT' : 'REDEEM AND INVITE'}
                </button>
              </article>
            )}

            {error && <p className="mt-4 text-sm text-crimson">{error}</p>}
            {confirmation && <p className="mt-4 text-sm text-ink">{confirmation}</p>}

            {state.redemptions.length > 0 && (
              <section className="mt-6">
                <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
                  PASSES USED
                </h2>
                <ul className="mt-2 divide-y divide-ink/10">
                  {state.redemptions.map((r) => (
                    <li key={r.redeemedAt} className="flex justify-between py-3 text-sm">
                      <span>{r.friendName}</span>
                      <span className="text-muted">{formatDate(r.redeemedAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {platinum && events.length > 0 && (
          <section className="mt-8">
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">EVENT PASSES</h2>
            <p className="mt-2 text-sm text-muted">
              Reserved entry for Platinum. Claim a pass and it waits at the desk.
            </p>
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <article key={event.id} className="border border-ink/10 p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-headline text-lg">{event.title}</p>
                    <p className="text-xs text-muted">{formatDate(event.startsAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{event.venue}</p>
                  <p className="mt-2 text-sm text-ink/80">{event.detail}</p>
                  {event.claimed ? (
                    <p className="mt-4 border-t border-ink/10 pt-3 font-headline text-sm text-gold">
                      Pass claimed
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleClaim(event)}
                      disabled={claimBusyId === event.id}
                      className="mt-4 w-full bg-crimson py-3 font-headline text-xs tracking-[0.2em] text-paper disabled:opacity-40"
                    >
                      {claimBusyId === event.id ? 'ONE MOMENT' : 'CLAIM PASS'}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {eventNote && <p className="mt-4 text-sm text-ink">{eventNote}</p>}
          </section>
        )}
      </main>
    </div>
  )
}
