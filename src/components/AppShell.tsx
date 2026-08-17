import { Navigate, Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useMember } from '../lib/member-context'

/** Signed-in layout: screen content above, bottom navigation below. */
export default function AppShell() {
  const { member, loading } = useMember()

  if (loading) return <div className="min-h-dvh bg-ink" />
  if (!member) return <Navigate to="/login" replace />

  return (
    <div className="min-h-dvh bg-paper pb-24">
      <Outlet />
      <BottomNav />
    </div>
  )
}
