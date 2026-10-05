import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, supabaseConfigurationError } from '../lib/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const started = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true

    const completeSignIn = async () => {
      try {
        const callbackError =
          new URLSearchParams(window.location.search).get('error_description') ||
          new URLSearchParams(window.location.hash.slice(1)).get('error_description')
        if (callbackError) throw new Error(callbackError)
        if (!supabase) {
          throw new Error(supabaseConfigurationError)
        }
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!data.session?.access_token) {
          throw new Error('No OAuth session was returned. Please try signing in again.')
        }

        const response = await fetch('/api/v1/auth/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: data.session.access_token }),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.detail || 'Unable to complete OAuth sign-in.')
        }

        localStorage.setItem('token', result.access_token)
        localStorage.setItem('user', JSON.stringify(result.user))
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (import.meta.env.DEV) console.error('OAuth callback failed:', err)
        setError(err.message || 'Unable to complete sign-in. Please try again.')
      }
    }

    completeSignIn()
  }, [navigate])

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-center shadow-2xl">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">Sign-in could not be completed</h1>
            <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>
            <Link className="mt-6 inline-flex text-blue-300 hover:text-blue-200" to="/login">
              Return to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
            <h1 className="mt-5 text-2xl font-semibold">Completing sign-in</h1>
            <p className="mt-2 text-slate-300">Restoring your Enthesis session…</p>
          </>
        )}
      </section>
    </main>
  )
}

export default AuthCallback
