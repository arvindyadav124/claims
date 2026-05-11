import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { loginRequest, registerRequest } from '@/features/auth/auth.api'
import { isAuthenticated, setStoredToken } from '@/features/auth/tokenStorage'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

type RegisterForm = {
  email: string
  password: string
  confirm_password: string
}

export function RegisterPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterForm>({ defaultValues: { email: '', password: '', confirm_password: '' } })

  const signup = useMutation({
    mutationFn: async (values: RegisterForm) => {
      await registerRequest({
        email: values.email.trim(),
        password: values.password,
        password_confirm: values.confirm_password,
      })
      return loginRequest({ email: values.email.trim(), password: values.password })
    },
    onSuccess: (data) => {
      clearErrors()
      setStoredToken(data.token)
      navigate('/', { replace: true })
    },
    onError: (error: unknown) => {
      const fieldErrors = getApiFieldErrors(error)
      let mapped = false
      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key === 'email') {
          setError('email', { message: msg })
          mapped = true
        } else if (key === 'password') {
          setError('password', { message: msg })
          mapped = true
        } else if (key === 'password_confirm') {
          setError('confirm_password', { message: msg })
          mapped = true
        }
      }
      if (!mapped) {
        setError('root', { message: getApiErrorMessage(error, 'Registration failed.') })
      }
    },
  })

  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up with your email and a password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              clearErrors()
              if (values.password !== values.confirm_password) {
                setError('confirm_password', { message: 'Passwords do not match.' })
                return
              }
              signup.mutate(values)
            })}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="register-email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Email is required.' })}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="register-password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...register('password', { required: 'Password is required.' })}
              />
              {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="register-confirm" className="text-sm font-medium leading-none">
                Confirm password
              </label>
              <Input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                {...register('confirm_password', { required: 'Please confirm your password.' })}
              />
              {errors.confirm_password ? (
                <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
              ) : null}
            </div>
            {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
            <Button className="w-full" type="submit" disabled={signup.isPending}>
              {signup.isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
