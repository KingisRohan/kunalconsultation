import { NavLink } from 'react-router-dom'

/**
 * Bottom navigation. Sits on INK inside the mobile safe zone.
 * CRIMSON marks the active tab, the single interactive accent.
 */

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9" strokeWidth="1.6" strokeLinecap="square" />
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeWidth="1.6" strokeLinecap="square" />,
  },
  {
    to: '/passes',
    label: 'Passes',
    icon: (
      <path
        d="M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V8ZM14 8v10"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <path
        d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 9c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 border-t border-paper/10 bg-ink">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              'flex flex-1 flex-col items-center gap-1 pt-3 pb-1 text-[11px] tracking-wide ' +
              (isActive ? 'text-crimson' : 'text-paper/50')
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              {tab.icon}
            </svg>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
