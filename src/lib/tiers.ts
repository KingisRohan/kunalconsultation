import type { Entitlement, Tier, TierId } from './types'

export const TIERS: Record<TierId, Tier> = {
  citizen: {
    id: 'citizen',
    name: 'Citizen',
    priceInr: 16000,
    rank: 1,
    adds: [
      {
        id: 'profile',
        title: 'Profile and membership record',
        detail: 'Your standing, tier, and validity in one place.',
      },
      {
        id: 'entitlements',
        title: 'Entitlement view',
        detail: 'Everything your membership includes, itemised.',
      },
      {
        id: 'quotes',
        title: 'Daily quote feed',
        detail: 'One line a day, in the house voice.',
      },
    ],
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    priceInr: 21000,
    rank: 2,
    adds: [
      {
        id: 'walkin-reminders',
        title: 'Walk-in reminders',
        detail: 'A quiet nudge on WhatsApp when the gap grows.',
        usage: { noun: 'reminders sent' },
      },
      {
        id: 'progress',
        title: 'Progress tracking',
        detail: 'Sessions, streaks, and measurements over time.',
        usage: { noun: 'sessions logged' },
      },
      {
        id: 'recovery',
        title: 'Recovery protocol delivery',
        detail: 'Protocols sent after hard sessions, on schedule.',
        usage: { noun: 'protocols delivered' },
      },
    ],
  },
  gladiator: {
    id: 'gladiator',
    name: 'Gladiator',
    priceInr: 35000,
    rank: 3,
    adds: [
      {
        id: 'nutrition-consult',
        title: 'Quarterly nutrition consultation',
        detail: 'Scheduled automatically from your setup date.',
        usage: { noun: 'used this year', cap: 4 },
      },
      {
        id: 'workout-consult',
        title: 'Quarterly workout consultation',
        detail: 'Programme reviewed every quarter, reminders included.',
        usage: { noun: 'used this year', cap: 4 },
      },
      {
        id: 'friend-passes',
        title: 'Ten friend passes',
        detail: 'One redeemable every seven days, ten in total.',
        usage: { noun: 'redeemed', cap: 10 },
      },
    ],
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    priceInr: 55000,
    rank: 4,
    adds: [
      {
        id: 'full-access',
        title: 'Full complex access',
        detail: 'Every court, pool, and floor in the complex.',
      },
      {
        id: 'event-passes',
        title: 'Event passes',
        detail: 'Reserved entry to Sparta events.',
        usage: { noun: 'redeemed' },
      },
      {
        id: 'therapy-discounts',
        title: 'Physiotherapy and massage discounts',
        detail: 'Member pricing on recovery services.',
        usage: { noun: 'visits at member pricing' },
      },
    ],
  },
}

export const TIER_ORDER: TierId[] = ['citizen', 'warrior', 'gladiator', 'platinum']

/** All entitlements a tier holds, including everything inherited from lower tiers. */
export function entitlementsFor(tierId: TierId): { tier: Tier; entitlements: Entitlement[] }[] {
  const rank = TIERS[tierId].rank
  return TIER_ORDER.filter((id) => TIERS[id].rank <= rank).map((id) => ({
    tier: TIERS[id],
    entitlements: TIERS[id].adds,
  }))
}

/** The next tier up, or null if already at the top. */
export function nextTier(tierId: TierId): Tier | null {
  const idx = TIER_ORDER.indexOf(tierId)
  return idx < TIER_ORDER.length - 1 ? TIERS[TIER_ORDER[idx + 1]] : null
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Usage line for an entitlement card, or null when there is nothing to show. */
export function usageLine(entitlement: Entitlement, count: number | undefined): string | null {
  if (!entitlement.usage) return null
  const n = count ?? 0
  if (entitlement.usage.cap) return `${n} of ${entitlement.usage.cap} ${entitlement.usage.noun}`
  if (n === 0) return null
  // Nouns are stored plural, e.g. "reminders sent"; singularise the first word.
  const noun = n === 1 ? entitlement.usage.noun.replace(/^(\w+)s\b/, '$1') : entitlement.usage.noun
  return `${n} ${noun}`
}
