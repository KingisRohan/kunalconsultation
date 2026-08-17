import { TIERS } from '../lib/tiers'
import type { TierId } from '../lib/types'

/**
 * Tier badges are the one place GOLD is allowed as a surface.
 * Platinum skews gold-forward with a filled badge; other tiers keep a gold rule.
 */
export default function TierBadge({ tier }: { tier: TierId }) {
  const name = TIERS[tier].name.toUpperCase()

  if (tier === 'platinum') {
    return (
      <span className="inline-block bg-gold px-3 py-1 font-headline text-xs tracking-[0.2em] text-ink">
        {name}
      </span>
    )
  }

  return (
    <span className="inline-block border border-gold px-3 py-1 font-headline text-xs tracking-[0.2em] text-gold">
      {name}
    </span>
  )
}
