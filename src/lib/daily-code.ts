/**
 * Rotating desk code derivation, mirroring
 * supabase/functions/_shared/daily-code.ts. Used only in demo mode with a
 * public demo secret; the real secret never reaches the client.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0, O, 1, I, L

/** Today's date in Asia/Kolkata, YYYY-MM-DD. */
export function istToday(): string {
  return new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10)
}

export async function dailyCode(secret: string, date: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(date)))
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET[sig[i] % ALPHABET.length]
  return code
}
