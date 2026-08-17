import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMember } from './auth'
import type { Member } from './types'

interface MemberState {
  member: Member | null
  loading: boolean
  refresh: () => Promise<void>
}

const MemberContext = createContext<MemberState>({
  member: null,
  loading: true,
  refresh: async () => {},
})

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setMember(await getMember())
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <MemberContext.Provider value={{ member, loading, refresh }}>{children}</MemberContext.Provider>
}

export function useMember(): MemberState {
  return useContext(MemberContext)
}
