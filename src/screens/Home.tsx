import { useEffect, useState } from 'react'
import CheckInCard from '../components/CheckInCard'
import TierBadge from '../components/TierBadge'
import { getDiscounts, getFeedItems, getUsage } from '../lib/data'
import { quoteForToday } from '../lib/demo'
import { TIERS, entitlementsFor, formatInr, nextTier, usageLine } from '../lib/tiers'
import { useMember } from '../lib/member-context'
import type { Discount, FeedItem, UsageCounts } from '../lib/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export default function Home() {
  const { member } = useMember()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [usage, setUsage] = useState<UsageCounts>({})
  const [discounts, setDiscounts] = useState<Discount[]>([])

  useEffect(() => {
    if (!member) return
    void getFeedItems(member).then(setFeed)
    void getUsage(member).then(setUsage)
    if (member.tier === 'platinum') void getDiscounts().then(setDiscounts)
  }, [member])

  if (!member) return null

  const tier = TIERS[member.tier]
  const included = entitlementsFor(member.tier)
  const upgrade = nextTier(member.tier)
  const quote = quoteForToday()
  const firstName = member.name.split(' ')[0]

  return (
    <div className="text-ink">
      <header className="safe-top bg-ink px-6 pb-8 text-paper">
        <div className="flex items-center justify-between pt-4">
          <p className="font-headline text-xs tracking-[0.3em] text-paper/60">SPARTA LIFE</p>
          <TierBadge tier={member.tier} />
        </div>
        <h1 className="mt-8 font-headline text-3xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-2 font-editorial text-lg italic text-paper/70">{quote.text}</p>
      </header>

      <main className="px-6 pt-6">
        <CheckInCard member={member} />

        {/* Full complex access, the Platinum flagship. Gold-forward by design. */}
        {member.tier === 'platinum' && (
          <section className="pb-6">
            <article className="border border-gold p-5">
              <h2 className="font-headline text-sm tracking-[0.2em] text-gold">
                FULL COMPLEX ACCESS
              </h2>
              <p className="mt-2 text-sm text-ink/80">
                Every court, pool, and floor is open to you. Show your profile at any desk.
              </p>
            </article>
          </section>
        )}

        {/* Delivered reminders, mirrored from WhatsApp */}
        {feed.length > 0 && (
          <section>
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">REMINDERS</h2>
            <div className="mt-3 space-y-3">
              {feed.map((item) => (
                <article key={item.id} className="border border-ink/10 p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-headline text-xs tracking-[0.2em] text-muted">
                      {item.kind.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-2 font-headline text-lg">{item.title}</p>
                  <p className="mt-1 text-sm text-ink/80">{item.body}</p>
                  {item.quoteText && (
                    <p className="mt-3 border-t border-ink/10 pt-3 font-editorial italic text-muted">
                      {item.quoteText}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Membership summary */}
        <section className="py-6">
          <article className="border border-ink/10 p-5">
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">MEMBERSHIP</h2>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-headline text-2xl">{tier.name}</p>
              <p className="font-headline text-2xl text-gold">{formatInr(tier.priceInr)}</p>
            </div>
          </article>
        </section>

        {/* Entitlement cards with usage, grouped by inherited tier */}
        <section className="pb-6">
          <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
            WHAT YOUR MEMBERSHIP INCLUDES
          </h2>
          {included.map(({ tier: t, entitlements }) => (
            <div key={t.id} className="mt-4">
              <p className="font-headline text-xs tracking-[0.2em] text-gold">
                {t.name.toUpperCase()}
              </p>
              <div className="mt-2 space-y-3">
                {entitlements.map((e) => {
                  const line = usageLine(e, usage[e.id])
                  return (
                    <article key={e.id} className="border border-ink/10 p-5">
                      <p className="font-medium">{e.title}</p>
                      <p className="mt-1 text-sm text-muted">{e.detail}</p>
                      {line && (
                        <p className="mt-3 border-t border-ink/10 pt-3 font-headline text-sm text-gold">
                          {line}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Member pricing, surfaced to Platinum */}
        {member.tier === 'platinum' && discounts.length > 0 && (
          <section className="border-t border-ink/10 py-6">
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">MEMBER PRICING</h2>
            <div className="mt-3 space-y-3">
              {discounts.map((d) => (
                <article key={d.service} className="border border-ink/10 p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium">{d.service}</p>
                    <p className="font-headline text-lg text-gold">{d.percent} percent off</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{d.detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              Applied at the desk when you book. No code needed.
            </p>
          </section>
        )}

        {upgrade && (
          <section className="border-t border-ink/10 py-6">
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">
              {upgrade.name.toUpperCase()} ADDS
            </h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {upgrade.adds.map((e) => (
                <li key={e.id} className="py-3">
                  <p className="font-medium text-ink/60">{e.title}</p>
                  <p className="mt-1 text-sm text-muted">{e.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              Ask at the front desk about moving to {upgrade.name}.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
