import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLoginMutation } from '@/lib/queries'
import { useUIStore } from '@/store/uiStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { LoginForm } from '@/features/forms/LoginForm'
import type { LoginValues } from '@/features/forms/schemas'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const setAccessToken = useUIStore((s) => s.setAccessToken)
  const setUserRole = useUIStore((s) => s.setUserRole)
  const setUsername = useUIStore((s) => s.setUsername)
  const setPersona = useUIStore((s) => s.setPersona)
  const showToast = useUIStore((s) => s.showToast)

  const loginMutation = useLoginMutation()
  const [serverError, setServerError] = useState<string>()

  const handleSubmit = async (values: LoginValues) => {
    setServerError(undefined)
    try {
      const res = await loginMutation.mutateAsync({
        username: values.username,
        password: values.password,
      })

      const role = (res.user?.role ?? 'driver') as 'driver' | 'operator' | 'admin' | 'judge'
      setAccessToken(res.access_token)
      setUserRole(role)
      setUsername(values.username)

      if (role === 'operator' || role === 'admin') {
        setPersona('operator')
      } else {
        setPersona('driver')
      }

      showToast(`Welcome, ${values.username}! Logged in as ${role}.`, 'success')

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      navigate(from ?? (role === 'operator' || role === 'admin' ? '/operator' : '/driver'), {
        replace: true,
      })
    } catch (err: unknown) {
      setServerError(
        (err as Error).message ?? 'Sign-in failed — check your username and password and try again.',
      )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Card>
          <CardHeader>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'var(--color-trafo-blue)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: '12px',
                }}
              >
                <Lock size={24} />
              </div>
              <CardTitle style={{ fontSize: '20px' }}>Sign In to GridFlow EV</CardTitle>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', marginTop: '4px' }}>
                JWT authentication with Argon2 password verification
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {/* RHF + Zod login form */}
            <LoginForm
              onSubmit={handleSubmit}
              isSubmitting={loginMutation.isPending}
              serverError={serverError}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
