import { isDemoMode, supabaseAnonKey, supabaseUrl } from './config'
import {
  demoBiometrics,
  demoCheckIn,
  demoClaimedEventCount,
  demoClaimEventPass,
  demoDiscounts,
  demoGetAttendance,
  demoGetEvents,
  demoPassState,
  demoProcessDueReminders,
  demoRedeemPass,
  demoUsage,
} from './demo'
import { supabase } from './supabase'
import type {
  AttendanceDay,
  BiometricReading,
  CheckInResult,
  ClaimResult,
  Discount,
  EventItem,
  FeedItem,
  Member,
  PassState,
  RedeemResult,
  UsageCounts,
} from './types'

/** Reads and actions behind the signed-in screens. */

export async function getFeedItems(member: Member): Promise<FeedItem[]> {
  if (isDemoMode) {
    return demoProcessDueReminders(member)
  }

  const { data } = await supabase!
    .from('feed_items')
    .select('id, kind, title, body, quote_text, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    quoteText: row.quote_text,
    createdAt: row.created_at,
  }))
}

export async function getUsage(member: Member): Promise<UsageCounts> {
  if (isDemoMode) {
    const counts = { ...(demoUsage[member.id] ?? {}) }
    // Pass and event usage track the demo stores, not the static seed.
    const passes = demoPassState(member).used
    if (passes > 0) counts['friend-passes'] = passes
    const events = (counts['event-passes'] ?? 0) + demoClaimedEventCount(member)
    if (events > 0) counts['event-passes'] = events
    return counts
  }

  const { data } = await supabase!.from('entitlement_usage').select('entitlement_id')

  const counts: UsageCounts = {}
  for (const row of data ?? []) {
    counts[row.entitlement_id] = (counts[row.entitlement_id] ?? 0) + 1
  }
  return counts
}

const PASS_CAP = 10
const PASS_WINDOW_DAYS = 7

export async function getPassState(member: Member): Promise<PassState> {
  if (isDemoMode) {
    return demoPassState(member)
  }

  const { data } = await supabase!
    .from('pass_redemptions')
    .select('redeemed_at, leads ( friend_name )')
    .order('redeemed_at', { ascending: false })

  const redemptions = (data ?? []).map((row) => ({
    friendName: (row.leads as unknown as { friend_name: string })?.friend_name ?? '',
    redeemedAt: row.redeemed_at,
  }))

  let nextAvailableAt: string | null = null
  if (redemptions.length > 0 && redemptions.length < PASS_CAP) {
    const next = new Date(
      new Date(redemptions[0].redeemedAt).getTime() + PASS_WINDOW_DAYS * 86_400_000,
    )
    if (next > new Date()) nextAvailableAt = next.toISOString()
  }

  return { used: redemptions.length, cap: PASS_CAP, nextAvailableAt, redemptions }
}

export async function redeemPass(
  member: Member,
  friendName: string,
  friendPhone: string,
  honeypot: string,
): Promise<RedeemResult> {
  if (isDemoMode) {
    // Honeypot filled means a bot. Report success, write nothing.
    if (honeypot.trim() !== '') return { ok: true }
    return demoRedeemPass(member, friendName, friendPhone)
  }

  const { data: session } = await supabase!.auth.getSession()
  const res = await fetch(`${supabaseUrl}/functions/v1/redeem-pass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session?.access_token ?? ''}`,
      apikey: supabaseAnonKey!,
    },
    body: JSON.stringify({ friendName, friendPhone, website: honeypot }),
  })
  const data = await res.json().catch(() => ({}))
  if (data.ok) return { ok: true }
  return {
    ok: false,
    error: String(data.error ?? 'Something went wrong. Try again in a moment.'),
    nextAvailableAt: typeof data.nextAvailableAt === 'string' ? data.nextAvailableAt : undefined,
  }
}

export async function getEvents(member: Member): Promise<EventItem[]> {
  if (isDemoMode) {
    return demoGetEvents(member)
  }

  const [{ data: events }, { data: rsvps }] = await Promise.all([
    supabase!
      .from('events')
      .select('id, title, detail, venue, starts_at')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
    supabase!.from('event_rsvps').select('event_id'),
  ])

  const claimed = new Set((rsvps ?? []).map((r) => r.event_id))
  return (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    detail: e.detail,
    venue: e.venue,
    startsAt: e.starts_at,
    claimed: claimed.has(e.id),
  }))
}

export async function claimEventPass(member: Member, eventId: string): Promise<ClaimResult> {
  if (isDemoMode) {
    return demoClaimEventPass(member, eventId)
  }

  const { data: session } = await supabase!.auth.getSession()
  const res = await fetch(`${supabaseUrl}/functions/v1/claim-event-pass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session?.access_token ?? ''}`,
      apikey: supabaseAnonKey!,
    },
    body: JSON.stringify({ eventId }),
  })
  const data = await res.json().catch(() => ({}))
  if (data.ok) return { ok: true }
  return { ok: false, error: String(data.error ?? 'Something went wrong. Try again in a moment.') }
}

export async function getDiscounts(): Promise<Discount[]> {
  if (isDemoMode) {
    return demoDiscounts
  }

  const { data } = await supabase!
    .from('discounts')
    .select('service, percent, detail')
    .order('percent', { ascending: false })

  return (data ?? []).map((d) => ({ service: d.service, percent: d.percent, detail: d.detail }))
}

export async function getAttendance(member: Member): Promise<AttendanceDay[]> {
  if (isDemoMode) {
    return demoGetAttendance(member)
  }

  const { data } = await supabase!
    .from('attendance')
    .select('attended_on, source')
    .order('attended_on', { ascending: false })
    .limit(90)

  return (data ?? []).map((row) => ({
    date: row.attended_on,
    source: row.source as AttendanceDay['source'],
  }))
}

export async function checkIn(member: Member, code: string): Promise<CheckInResult> {
  if (isDemoMode) {
    return demoCheckIn(member, code)
  }

  const { data: session } = await supabase!.auth.getSession()
  const res = await fetch(`${supabaseUrl}/functions/v1/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session?.access_token ?? ''}`,
      apikey: supabaseAnonKey!,
    },
    body: JSON.stringify({ code }),
  })
  const data = await res.json().catch(() => ({}))
  if (data.ok) return { ok: true, alreadyRecorded: Boolean(data.alreadyRecorded) }
  return { ok: false, error: String(data.error ?? 'Something went wrong. Try again in a moment.') }
}

export async function getBiometrics(member: Member): Promise<BiometricReading[]> {
  if (isDemoMode) {
    return demoBiometrics[member.id] ?? []
  }

  const { data } = await supabase!
    .from('biometrics')
    .select('recorded_on, weight_kg, body_fat_pct, muscle_kg, source')
    .order('recorded_on', { ascending: true })

  return (data ?? []).map((row) => ({
    recordedOn: row.recorded_on,
    weightKg: row.weight_kg,
    bodyFatPct: row.body_fat_pct,
    muscleKg: row.muscle_kg,
    source: row.source as 'crm' | 'staff',
  }))
}
