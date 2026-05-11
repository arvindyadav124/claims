import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { loginRequest } from '@/features/auth/auth.api'
import { isAuthenticated, setStoredToken } from '@/features/auth/tokenStorage'
import { getApiErrorMessage } from '@/lib/api'

type LoginForm = {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } })

  const login = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setStoredToken(data.token)
      navigate(from, { replace: true })
    },
    onError: (error) => {
      setError('root', { message: getApiErrorMessage(error, 'Sign-in failed.') })
    },
  })

  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your account email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit((values) => login.mutate(values))} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" {...register('email', { required: true })} />
              {errors.email ? <p className="text-sm text-destructive">Email is required.</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', { required: true })}
              />
              {errors.password ? <p className="text-sm text-destructive">Password is required.</p> : null}
            </div>
            {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
            <Button className="w-full" type="submit" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{' '}
              <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
