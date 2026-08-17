import { useNavigate } from 'react-router-dom'
import TierBadge from '../components/TierBadge'
import { setDemoTierOverride, signOutMember } from '../lib/auth'
import { isDemoMode } from '../lib/config'
import { TIERS, TIER_ORDER } from '../lib/tiers'
import { useMember } from '../lib/member-context'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Profile() {
  const navigate = useNavigate()
  const { member, refresh } = useMember()
  if (!member) return null

  return (
    <div className="text-ink">
      <header className="safe-top bg-ink px-6 pb-8 text-paper">
        <h1 className="pt-4 font-headline text-3xl">Profile</h1>
      </header>

      <main className="px-6">
        <section className="border-b border-ink/10 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline text-2xl">{member.name}</p>
              <p className="mt-1 text-sm text-muted">{member.phone}</p>
            </div>
            <TierBadge tier={member.tier} />
          </div>
          <p className="mt-4 text-sm text-muted">
            Set up {formatDate(member.setupDate)}.
            {member.validUntil && <> Valid until {formatDate(member.validUntil)}.</>}
          </p>
        </section>

        {isDemoMode && (
          <section className="border-b border-ink/10 py-6">
            <h2 className="font-headline text-sm tracking-[0.2em] text-muted">DEMO CONTROLS</h2>
            <p className="mt-2 text-sm text-muted">Preview the app as each tier.</p>
            <div className="mt-3 flex gap-2">
              {TIER_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={async () => {
                    setDemoTierOverride(id)
                    await refresh()
                  }}
                  className={
                    'flex-1 border py-2 font-headline text-xs tracking-widest ' +
                    (id === member.tier
                      ? 'border-crimson bg-crimson text-paper'
                      : 'border-ink/20 text-ink/70')
                  }
                >
                  {TIERS[id].name.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="py-6">
          <button
            type="button"
            onClick={async () => {
              await signOutMember()
              await refresh()
              navigate('/login', { replace: true })
            }}
            className="w-full py-3 text-sm text-muted underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  )
}
