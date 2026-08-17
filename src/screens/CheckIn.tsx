import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { checkIn } from '../lib/data'
import { useMember } from '../lib/member-context'

/**
 * Landing route for the desk QR, which encodes /checkin?c=<code>. Scanning
 * with the phone camera opens the installed app here and the check-in
 * happens without typing.
 */
export default function CheckIn() {
  const { member } = useMember()
  const [params] = useSearchParams()
  const [message, setMessage] = useState('')
  const attempted = useRef(false)

  const code = params.get('c') ?? ''

  useEffect(() => {
    if (!member || attempted.current) return
    attempted.current = true
    if (!code) {
      setMessage('No code in that link. Scan the desk QR again.')
      return
    }
    void checkIn(member, code).then((result) => {
      setMessage(
        result.ok
          ? result.alreadyRecorded
            ? 'Already marked for today.'
            : 'Marked present for today.'
          : result.error,
      )
    })
  }, [member, code])

  return (
    <div className="text-ink">
      <header className="safe-top bg-ink px-6 pb-8 text-paper">
        <h1 className="pt-4 font-headline text-3xl">Check-in</h1>
      </header>
      <main className="px-6 py-8">
        <p className={message ? '' : 'text-muted'}>{message || 'One moment.'}</p>
        <Link to="/" className="mt-6 inline-block text-sm text-muted underline underline-offset-4">
          Back to home
        </Link>
      </main>
    </div>
  )
}
