import { dailyCode, istToday } from './daily-code'
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
  Quote,
  RedeemResult,
  UsageCounts,
} from './types'

/**
 * Demo seed data, used when no Supabase environment variables are set.
 * Mirrors supabase/seed/seed.sql so demo and connected behavior match.
 */

export const DEMO_OTP = '123456'

export const demoMembers: Member[] = [
  {
    id: 'demo-citizen',
    name: 'Meera Kulkarni',
    phone: '+919800000001',
    tier: 'citizen',
    setupDate: '2026-01-12',
    validUntil: '2027-01-11',
  },
  {
    id: 'demo-warrior',
    name: 'Aarav Deshmukh',
    phone: '+919800000002',
    tier: 'warrior',
    setupDate: '2025-11-02',
    validUntil: '2026-11-01',
  },
  {
    id: 'demo-gladiator',
    name: 'Kabir Sethi',
    phone: '+919800000003',
    tier: 'gladiator',
    setupDate: '2026-03-20',
    validUntil: '2027-03-19',
  },
  {
    id: 'demo-platinum',
    name: 'Devika Rao',
    phone: '+919800000004',
    tier: 'platinum',
    setupDate: '2026-05-05',
    validUntil: '2027-05-04',
  },
]

export function demoMemberByPhone(phone: string): Member | undefined {
  return demoMembers.find((m) => m.phone === phone)
}

export const quotes: Quote[] = [
  { id: 'q1', text: 'Strength is built in the hours nobody watches.' },
  { id: 'q2', text: 'Show up. The rest is arithmetic.' },
  { id: 'q3', text: 'Rest is part of the programme, not a break from it.' },
  { id: 'q4', text: 'Progress prefers the patient.' },
  { id: 'q5', text: 'A calm body is a trained body.' },
  { id: 'q6', text: 'The work is the reward. The result is a receipt.' },
  { id: 'q7', text: 'Discipline is a quiet habit. Keep it quietly.' },
  { id: 'q8', text: 'Sessions kept beat plans made.' },
  { id: 'q9', text: 'Train the habit. The muscle follows.' },
  { id: 'q10', text: 'Begin before the doubt wakes.' },
  { id: 'q11', text: 'Nobody counts the reps you skipped. The body does.' },
  { id: 'q12', text: 'Consistency is rent. It falls due daily.' },
]

/** Deterministic quote of the day, rotating through the feed by date. */
export function quoteForToday(date = new Date()): Quote {
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000)
  return quotes[daysSinceEpoch % quotes.length]
}

/** Usage counts per member, mirroring the entitlement_usage seed. */
export const demoUsage: Record<string, UsageCounts> = {
  'demo-citizen': {},
  'demo-warrior': { progress: 14, recovery: 5, 'walkin-reminders': 3 },
  'demo-gladiator': {
    progress: 22,
    recovery: 8,
    'walkin-reminders': 1,
    'friend-passes': 2,
    'nutrition-consult': 1,
    'workout-consult': 2,
  },
  'demo-platinum': {
    progress: 31,
    recovery: 11,
    'friend-passes': 4,
    'nutrition-consult': 2,
    'workout-consult': 1,
    'event-passes': 1,
    'therapy-discounts': 2,
  },
}

interface DemoReminder {
  id: string
  memberId: string
  kind: string
  title: string
  body: string
  quoteText: string | null
  campaignName: string
  dueAt: string
}

/** Due reminders, mirroring the reminders seed. Citizen gets none by design. */
export const demoReminders: DemoReminder[] = [
  {
    id: 'demo-reminder-walkin',
    memberId: 'demo-warrior',
    kind: 'walk_in',
    title: 'A week since your last walk-in',
    body: 'The floor has been quiet without you. A session this week keeps the rhythm.',
    quoteText: 'Sessions kept beat plans made.',
    campaignName: 'walk_in_reminder',
    dueAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'demo-reminder-consult',
    memberId: 'demo-gladiator',
    kind: 'consultation',
    title: 'Nutrition consultation set',
    body: 'Your quarterly nutrition consultation is booked for 24 July at 6 pm. Reply to move it.',
    quoteText: null,
    campaignName: 'consultation_reminder',
    dueAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'demo-reminder-event',
    memberId: 'demo-platinum',
    kind: 'event',
    title: 'Monsoon league passes open',
    body: 'Event passes for the monsoon league open Saturday. Two are reserved under your name.',
    quoteText: 'Progress prefers the patient.',
    campaignName: 'event_notice',
    dueAt: '2026-07-01T00:00:00Z',
  },
]

const PASS_CAP = 10
const PASS_WINDOW_DAYS = 7
const PASSES_KEY = 'sparta.demo.passes'

interface DemoRedemption {
  friendName: string
  friendPhone: string
  redeemedAt: string
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

/** Seed redemptions, mirroring the pass_redemptions seed. Kabir can redeem
 * one now and then hits the weekly limit. Devika is inside the window. */
function defaultRedemptions(): Record<string, DemoRedemption[]> {
  return {
    'demo-gladiator': [
      { friendName: 'Nikhil Rane', friendPhone: '+919811111111', redeemedAt: daysAgo(40) },
      { friendName: 'Sameer Joshi', friendPhone: '+919811111112', redeemedAt: daysAgo(10) },
    ],
    'demo-platinum': [
      { friendName: 'Anita Menon', friendPhone: '+919811111113', redeemedAt: daysAgo(60) },
      { friendName: 'Farah Khan', friendPhone: '+919811111114', redeemedAt: daysAgo(30) },
      { friendName: 'Vikram Nair', friendPhone: '+919811111115', redeemedAt: daysAgo(12) },
      { friendName: 'Priya Iyer', friendPhone: '+919811111116', redeemedAt: daysAgo(3) },
    ],
  }
}

function readRedemptions(): Record<string, DemoRedemption[]> {
  try {
    const raw = localStorage.getItem(PASSES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to defaults
  }
  const defaults = defaultRedemptions()
  localStorage.setItem(PASSES_KEY, JSON.stringify(defaults))
  return defaults
}

export function demoPassState(member: Member): PassState {
  const redemptions = (readRedemptions()[member.id] ?? []).slice()
  redemptions.sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
  const last = redemptions[0]
  let nextAvailableAt: string | null = null
  if (redemptions.length >= PASS_CAP) {
    nextAvailableAt = null
  } else if (last) {
    const next = new Date(new Date(last.redeemedAt).getTime() + PASS_WINDOW_DAYS * 86_400_000)
    if (next > new Date()) nextAvailableAt = next.toISOString()
  }
  return {
    used: redemptions.length,
    cap: PASS_CAP,
    nextAvailableAt,
    redemptions: redemptions.map((r) => ({ friendName: r.friendName, redeemedAt: r.redeemedAt })),
  }
}

/** Demo counterpart of the redeem-pass edge function, same rules and copy. */
export function demoRedeemPass(
  member: Member,
  friendName: string,
  friendPhone: string,
): RedeemResult {
  const state = demoPassState(member)
  if (state.used >= PASS_CAP) {
    return { ok: false, error: 'All ten passes are used.' }
  }
  if (state.nextAvailableAt) {
    return { ok: false, error: 'One pass per seven days.', nextAvailableAt: state.nextAvailableAt }
  }

  const all = readRedemptions()
  all[member.id] = [
    ...(all[member.id] ?? []),
    { friendName, friendPhone, redeemedAt: new Date().toISOString() },
  ]
  localStorage.setItem(PASSES_KEY, JSON.stringify(all))

  console.log(
    '[aisensy log mode]',
    JSON.stringify({
      destination: friendPhone,
      campaignName: 'friend_pass_nurture',
      templateParams: [friendName.split(' ')[0], member.name.split(' ')[0]],
      apiKey: 'unset, log mode',
    }),
  )
  return { ok: true }
}

/** Biometric readings, mirroring the biometrics seed and the mock CRM. */
export const demoBiometrics: Record<string, BiometricReading[]> = {
  'demo-warrior': [
    { recordedOn: '2025-11-02', weightKg: 86.4, bodyFatPct: 24.1, muscleKg: 32.5, source: 'crm' },
    { recordedOn: '2025-12-14', weightKg: 85.1, bodyFatPct: 23.4, muscleKg: 32.8, source: 'crm' },
    { recordedOn: '2026-02-01', weightKg: 83.9, bodyFatPct: 22.6, muscleKg: 33.2, source: 'crm' },
    { recordedOn: '2026-03-22', weightKg: 83.0, bodyFatPct: 21.9, muscleKg: 33.5, source: 'crm' },
    { recordedOn: '2026-05-10', weightKg: 82.1, bodyFatPct: 21.0, muscleKg: 33.8, source: 'crm' },
    { recordedOn: '2026-07-05', weightKg: 81.2, bodyFatPct: 20.3, muscleKg: 34.1, source: 'crm' },
  ],
  'demo-gladiator': [
    { recordedOn: '2026-03-20', weightKg: 78.2, bodyFatPct: 18.9, muscleKg: 36.0, source: 'crm' },
    { recordedOn: '2026-04-24', weightKg: 77.6, bodyFatPct: 18.4, muscleKg: 36.3, source: 'crm' },
    { recordedOn: '2026-06-02', weightKg: 76.9, bodyFatPct: 17.8, muscleKg: 36.6, source: 'crm' },
    { recordedOn: '2026-07-08', weightKg: 76.3, bodyFatPct: 17.2, muscleKg: 36.9, source: 'crm' },
  ],
  'demo-platinum': [
    { recordedOn: '2026-05-05', weightKg: 62.4, bodyFatPct: 26.5, muscleKg: 24.0, source: 'crm' },
    { recordedOn: '2026-06-09', weightKg: 61.8, bodyFatPct: 25.9, muscleKg: 24.3, source: 'crm' },
    { recordedOn: '2026-07-10', weightKg: 61.2, bodyFatPct: 25.2, muscleKg: 24.6, source: 'crm' },
  ],
}

/** Public demo secret. The real CHECKIN_SECRET lives only on the server. */
const DEMO_CHECKIN_SECRET = 'sparta-demo'

/** Today's rotating desk code for demo mode, shown as the on-screen hint. */
export function demoDeskCode(): Promise<string> {
  return dailyCode(DEMO_CHECKIN_SECRET, istToday())
}

const ATTENDANCE_KEY = 'sparta.demo.attendance'

function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Visit offsets in days, mirroring the attendance seed and the mock CRM.
 * Aarav's last visit is eight days ago, inside the re-engagement window. */
const demoAttendanceBase: Record<string, number[]> = {
  'demo-citizen': [15, 25, 40],
  'demo-warrior': [8, 11, 13, 16, 20, 22, 27, 30, 34, 37, 41, 45],
  'demo-gladiator': [2, 5, 7, 9, 12, 14, 16, 19, 21],
  'demo-platinum': [1, 3, 6, 8, 10, 13],
}

function readAppCheckIns(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Unified attendance, newest first. External punches win over app
 * check-ins on the same day, matching record_attendance in the database. */
export function demoGetAttendance(member: Member): AttendanceDay[] {
  const external: AttendanceDay[] = (demoAttendanceBase[member.id] ?? []).map((n) => ({
    date: localDate(new Date(Date.now() - n * 86_400_000)),
    source: 'crm' as const,
  }))
  const seen = new Set(external.map((d) => d.date))
  const app: AttendanceDay[] = (readAppCheckIns()[member.id] ?? [])
    .filter((date) => !seen.has(date))
    .map((date) => ({ date, source: 'app' as const }))
  return [...external, ...app].sort((a, b) => b.date.localeCompare(a.date))
}

/** Demo counterpart of the check-in edge function, same rules and copy. */
export async function demoCheckIn(member: Member, code: string): Promise<CheckInResult> {
  const expected = await demoDeskCode()
  if (code.trim().toUpperCase() !== expected) {
    return { ok: false, error: 'That code did not match today’s desk QR.' }
  }
  const today = localDate(new Date())
  if (demoGetAttendance(member).some((d) => d.date === today)) {
    return { ok: true, alreadyRecorded: true }
  }
  const all = readAppCheckIns()
  all[member.id] = [...(all[member.id] ?? []), today]
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(all))
  return { ok: true, alreadyRecorded: false }
}

const EVENTS_KEY = 'sparta.demo.events'

function daysAhead(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString()
}

/** Upcoming events, mirroring the events seed. Dates are relative so the
 * list always reads as upcoming in demo mode. */
const demoEvents = [
  {
    id: 'demo-event-finals',
    title: 'Monsoon League Finals',
    detail: 'The season closes on centre court. Seats are held for Platinum until the first serve.',
    venue: 'Centre court',
    startsAt: daysAhead(5),
  },
  {
    id: 'demo-event-openmat',
    title: 'Open Mat Evening',
    detail: 'Coaches on the floor, all disciplines welcome. Bring a guest question, leave with an answer.',
    venue: 'Combat hall',
    startsAt: daysAhead(12),
  },
  {
    id: 'demo-event-recovery',
    title: 'Recovery Workshop',
    detail: 'An evening on sleep, cold, and the quiet work of getting stronger.',
    venue: 'Studio two',
    startsAt: daysAhead(20),
  },
]

/** Mirrors the discounts seed. */
export const demoDiscounts: Discount[] = [
  { service: 'Physiotherapy', percent: 20, detail: 'Assessment and sessions with the resident physiotherapist.' },
  { service: 'Sports massage', percent: 15, detail: 'Fifty minute sessions in the recovery suite.' },
  { service: 'Recovery suite', percent: 10, detail: 'Ice bath and sauna access outside class hours.' },
]

function readClaims(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function demoGetEvents(member: Member): EventItem[] {
  const claimed = new Set(readClaims()[member.id] ?? [])
  return demoEvents.map((e) => ({ ...e, claimed: claimed.has(e.id) }))
}

export function demoClaimedEventCount(member: Member): number {
  return (readClaims()[member.id] ?? []).length
}

/** Demo counterpart of the claim-event-pass edge function, same rules and copy. */
export function demoClaimEventPass(member: Member, eventId: string): ClaimResult {
  const event = demoEvents.find((e) => e.id === eventId)
  if (!event) return { ok: false, error: 'That event is no longer open.' }

  const claims = readClaims()
  const mine = claims[member.id] ?? []
  if (mine.includes(eventId)) {
    return { ok: false, error: 'A pass for this event already sits under your name.' }
  }
  claims[member.id] = [...mine, eventId]
  localStorage.setItem(EVENTS_KEY, JSON.stringify(claims))

  const eventDate = new Date(event.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
  })
  console.log(
    '[aisensy log mode]',
    JSON.stringify({
      destination: member.phone,
      campaignName: 'event_pass_confirmation',
      templateParams: [member.name.split(' ')[0], event.title, `${eventDate}, ${event.venue}`],
      apiKey: 'unset, log mode',
    }),
  )
  return { ok: true }
}

const PROCESSED_KEY = 'sparta.demo.processed'

function readProcessed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROCESSED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/**
 * Demo counterpart of the process-reminders scheduled job. Runs when the feed
 * is read: sends due unsent reminders through the same log-mode payload the
 * AiSensy module produces, then mirrors them into the feed.
 */
export function demoProcessDueReminders(member: Member): FeedItem[] {
  const processed = readProcessed()
  const now = new Date().toISOString()

  for (const reminder of demoReminders) {
    if (reminder.memberId !== member.id) continue
    if (processed[reminder.id] || reminder.dueAt > now) continue
    console.log(
      '[aisensy log mode]',
      JSON.stringify({
        destination: member.phone,
        campaignName: reminder.campaignName,
        templateParams: [member.name.split(' ')[0], reminder.body, reminder.quoteText ?? ''],
        apiKey: 'unset, log mode',
      }),
    )
    processed[reminder.id] = now
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(processed))
  }

  return demoReminders
    .filter((r) => r.memberId === member.id && processed[r.id])
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      quoteText: r.quoteText,
      createdAt: processed[r.id],
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
