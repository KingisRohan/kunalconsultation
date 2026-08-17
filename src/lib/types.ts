export type TierId = 'citizen' | 'warrior' | 'gladiator' | 'platinum'

export interface Entitlement {
  id: string
  title: string
  detail: string
  /** Present when the entitlement has countable usage to surface. */
  usage?: {
    /** Phrase after the number, e.g. "sessions logged". */
    noun: string
    /** Hard cap, shown as "n of cap", e.g. friend passes. */
    cap?: number
  }
}

export interface FeedItem {
  id: string
  kind: string
  title: string
  body: string
  quoteText: string | null
  createdAt: string
}

/** Aggregated usage counts keyed by entitlement id. */
export type UsageCounts = Record<string, number>

export interface PassRedemption {
  friendName: string
  redeemedAt: string
}

export interface PassState {
  used: number
  cap: number
  /** Null when a pass can be redeemed now. */
  nextAvailableAt: string | null
  redemptions: PassRedemption[]
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; error: string; nextAvailableAt?: string }

export interface BiometricReading {
  recordedOn: string
  weightKg: number | null
  bodyFatPct: number | null
  muscleKg: number | null
  source: 'crm' | 'staff'
}

export interface EventItem {
  id: string
  title: string
  detail: string
  venue: string
  startsAt: string
  /** True when this member already holds a pass. */
  claimed: boolean
}

export type ClaimResult = { ok: true } | { ok: false; error: string }

export interface Discount {
  service: string
  percent: number
  detail: string
}

/** One attended day from the unified attendance table, any source. */
export interface AttendanceDay {
  /** Local date, YYYY-MM-DD. */
  date: string
  source: 'crm' | 'device' | 'app'
}

export type CheckInResult =
  | { ok: true; alreadyRecorded: boolean }
  | { ok: false; error: string }

export interface Tier {
  id: TierId
  name: string
  priceInr: number
  /** Higher rank inherits everything below it. */
  rank: number
  /** Entitlements this tier adds on top of the tier below. */
  adds: Entitlement[]
}

export interface Member {
  id: string
  name: string
  /** E.164, e.g. +919812345678 */
  phone: string
  tier: TierId
  /** ISO date the membership was set up. Consultation schedules key off this. */
  setupDate: string
  validUntil: string | null
}

export interface Quote {
  id: string
  text: string
}
