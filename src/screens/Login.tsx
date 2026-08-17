import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestCode, verifyCode } from '../lib/auth'
import { isDemoMode } from '../lib/config'
import { DEMO_OTP } from '../lib/demo'
import { useMember } from '../lib/member-context'

type Step = 'phone' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const { refresh } = useMember()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const phoneValid = /^\d{10}$/.test(phone)
  const e164 = `+91${phone}`

  async function handleRequest() {
    setBusy(true)
    setError('')
    const result = await requestCode(e164)
    setBusy(false)
    if (result.ok) {
      setStep('otp')
    } else {
      setError(result.error)
    }
  }

  async function handleVerify() {
    setBusy(true)
    setError('')
    const result = await verifyCode(e164, otp)
    if (result.ok) {
      await refresh()
      navigate('/', { replace: true })
    } else {
      setBusy(false)
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      <div className="safe-top flex-1 px-6 pt-16">
        <p className="font-headline text-sm tracking-[0.3em] text-gold">SPARTA LIFE</p>
        <h1 className="mt-6 font-headline text-4xl leading-tight">
          {step === 'phone' ? 'Enter the gates.' : 'Check WhatsApp.'}
        </h1>
        <p className="mt-3 font-editorial text-lg italic text-paper/70">
          {step === 'phone'
            ? 'Membership has its privileges. Sign in to see yours.'
            : 'A six digit code is on its way to your number.'}
        </p>

        <div className="mt-12">
          {step === 'phone' ? (
            <label className="block">
              <span className="text-sm text-paper/60">Mobile number</span>
              <div className="mt-2 flex items-center border-b border-paper/30 pb-2">
                <span className="pr-3 text-lg text-paper/60">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-lg tracking-wider outline-none placeholder:text-paper/30"
                  placeholder="9800000000"
                />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="text-sm text-paper/60">Sign-in code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-2 w-full border-b border-paper/30 bg-transparent pb-2 text-2xl tracking-[0.5em] outline-none placeholder:text-paper/30"
                placeholder="000000"
              />
            </label>
          )}

          {error && <p className="mt-4 text-sm text-crimson">{error}</p>}
          {isDemoMode && (
            <p className="mt-4 text-sm text-muted">
              {step === 'phone'
                ? 'Demo mode. Use a seeded number, for example 9800000002.'
                : `Demo mode. The code is ${DEMO_OTP}.`}
            </p>
          )}
        </div>
      </div>

      <div className="safe-bottom px-6">
        <button
          type="button"
          onClick={step === 'phone' ? handleRequest : handleVerify}
          disabled={busy || (step === 'phone' ? !phoneValid : otp.length !== 6)}
          className="w-full bg-crimson py-4 font-headline text-sm tracking-[0.2em] text-paper disabled:opacity-40"
        >
          {busy ? 'ONE MOMENT' : step === 'phone' ? 'SEND CODE ON WHATSAPP' : 'VERIFY AND ENTER'}
        </button>
        {step === 'otp' && (
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError('')
            }}
            className="mt-4 w-full py-2 text-sm text-paper/60"
          >
            Use a different number
          </button>
        )}
      </div>
    </div>
  )
}
