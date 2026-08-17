import { isDemoMode, supabaseAnonKey, supabaseUrl } from './config'
import { DEMO_OTP, demoMemberByPhone } from './demo'
import { supabase } from './supabase'
import type { Member, TierId } from './types'

/**
 * Auth service. With Supabase configured it calls the request-otp and
 * verify-otp edge functions; the code arrives over WhatsApp through the
 * AiSensy module (or lands in messages_log when that runs in log mode).
 * In demo mode it mimics the same flow against local seed data.
 */

type Result = { ok: true } | { ok: false; error: string }

const DEMO_SESSION_KEY = 'sparta.session'

interface DemoSession {
  phone: string
  tierOverride?: TierId
}

function readDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

async function callFunction(name: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey!,
    },
    body: JSON.stringify(body),
  })
  return res.json().catch(() => ({ error: 'Something went wrong. Try again in a moment.' }))
}

export async function requestCode(phone: string): Promise<Result> {
  if (isDemoMode) {
    const member = demoMemberByPhone(phone)
    if (!member) return { ok: false, error: 'That number is not on the member list.' }
    // Same shape the AiSensy module logs in log mode.
    console.log(
      '[aisensy log mode]',
      JSON.stringify({
        destination: phone,
        campaignName: 'login_otp',
        templateParams: [DEMO_OTP],
        apiKey: 'unset, log mode',
      }),
    )
    return { ok: true }
  }

  const data = await callFunction('request-otp', { phone })
  return data.ok ? { ok: true } : { ok: false, error: String(data.error ?? 'Try again in a moment.') }
}

export async function verifyCode(phone: string, code: string): Promise<Result> {
  if (isDemoMode) {
    if (code !== DEMO_OTP) {
      return { ok: false, error: 'That code did not match. Check WhatsApp and try again.' }
    }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ phone }))
    return { ok: true }
  }

  const data = await callFunction('verify-otp', { phone, code })
  if (!data.ok || typeof data.token_hash !== 'string') {
    return { ok: false, error: String(data.error ?? 'Try again in a moment.') }
  }

  const { error } = await supabase!.auth.verifyOtp({ type: 'email', token_hash: data.token_hash })
  if (error) return { ok: false, error: 'Something went wrong. Try again in a moment.' }
  return { ok: true }
}

export async function getMember(): Promise<Member | null> {
  if (isDemoMode) {
    const session = readDemoSession()
    if (!session) return null
    const member = demoMemberByPhone(session.phone)
    if (!member) return null
    return session.tierOverride ? { ...member, tier: session.tierOverride } : member
  }

  const { data: auth } = await supabase!.auth.getUser()
  if (!auth.user) return null

  const { data: row } = await supabase!
    .from('members')
    .select('id, name, phone, tier, setup_date, valid_until')
    .maybeSingle()
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    tier: row.tier as TierId,
    setupDate: row.setup_date,
    validUntil: row.valid_until,
  }
}

export async function signOutMember(): Promise<void> {
  if (isDemoMode) {
    localStorage.removeItem(DEMO_SESSION_KEY)
    return
  }
  await supabase!.auth.signOut()
}

/** Demo-only tier override so every tier can be previewed on a phone. */
export function setDemoTierOverride(tier: TierId): void {
  const session = readDemoSession()
  if (!session) return
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ ...session, tierOverride: tier }))
}
