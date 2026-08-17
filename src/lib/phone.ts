/**
 * Normalise an Indian mobile number to E.164, or return null.
 * Mirrors the server-side check in the redeem-pass edge function.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '')
  if (/^\+91\d{10}$/.test(digits)) return digits
  if (/^91\d{10}$/.test(digits)) return `+${digits}`
  if (/^0\d{10}$/.test(digits)) return `+91${digits.slice(1)}`
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  if (/^\+\d{10,15}$/.test(digits)) return digits
  return null
}
