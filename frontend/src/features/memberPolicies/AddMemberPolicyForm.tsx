import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createMemberPolicy } from '@/features/memberPolicies/memberPolicies.api'
import { memberPoliciesQueryKey } from '@/features/memberPolicies/memberPolicies.keys'
import type { MemberPolicy, MemberPolicyCreatePayload } from '@/features/memberPolicies/types'
import { fetchMembers } from '@/features/members/members.api'
import { membersQueryKey } from '@/features/members/members.keys'
import { fetchPolicies } from '@/features/policies/policies.api'
import { policiesQueryKey } from '@/features/policies/policies.keys'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm = (): MemberPolicyCreatePayload => ({
  member: 0,
  policy: 0,
  purchasing_date: isoToday(),
  valid_up_to: '',
  price: '0.00',
})

const formFieldKeys: (keyof MemberPolicyCreatePayload)[] = [
  'member',
  'policy',
  'purchasing_date',
  'valid_up_to',
  'price',
]

export function AddMemberPolicyForm() {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: membersQueryKey,
    queryFn: fetchMembers,
  })

  const policiesQuery = useQuery({
    queryKey: policiesQueryKey,
    queryFn: fetchPolicies,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MemberPolicyCreatePayload>({ defaultValues: emptyForm() })

  const mutation = useMutation({
    mutationFn: createMemberPolicy,
    onSuccess: async (row: MemberPolicy) => {
      clearErrors()
      setSuccessMessage(
        `Enrollment saved (ID ${row.id}). Policy #${row.policy} for member #${row.member}, valid through ${row.valid_up_to}.`,
      )
      await queryClient.invalidateQueries({ queryKey: memberPoliciesQueryKey })
      reset(emptyForm())
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      const fieldErrors = getApiFieldErrors(error)
      for (const key of formFieldKeys) {
        const msg = fieldErrors[key]
        if (msg) setError(key, { message: msg })
      }
      const root = getApiErrorMessage(error, '')
      if (root && !Object.keys(fieldErrors).length) {
        setError('root', { message: root })
      }
    },
  })

  const members = membersQuery.data ?? []
  const policies = policiesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Purchase policy</CardTitle>
        <CardDescription>
          Enroll a member (linked user account) in a policy. Purchase date defaults to today; set coverage end and
          price for this enrollment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            setSuccessMessage(null)
            clearErrors()
            if (!values.member || values.member < 1) {
              setError('member', { message: 'Select a user (member).' })
              return
            }
            if (!values.policy || values.policy < 1) {
              setError('policy', { message: 'Select a policy.' })
              return
            }
            mutation.mutate({
              member: values.member,
              policy: values.policy,
              purchasing_date: values.purchasing_date,
              valid_up_to: values.valid_up_to,
              price: values.price.trim() || '0.00',
            })
          })}
          noValidate
        >
          {successMessage ? (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50"
            >
              {successMessage}
            </div>
          ) : null}
          {errors.root ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          ) : null}
          {membersQuery.isError ? (
            <p className="text-sm text-destructive">Could not load members for the user list.</p>
          ) : null}
          {policiesQuery.isError ? (
            <p className="text-sm text-destructive">Could not load policies.</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="User" error={errors.member?.message} className="sm:col-span-2">
              <select
                className={selectClass}
                disabled={membersQuery.isPending}
                {...register('member', { valueAsNumber: true })}
              >
                <option value={0}>Select user (member account)…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.email} — user #{m.user} ({m.first_name} {m.last_name})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Policy" error={errors.policy?.message} className="sm:col-span-2">
              <select
                className={selectClass}
                disabled={policiesQuery.isPending}
                {...register('policy', { valueAsNumber: true })}
              >
                <option value={0}>Select policy…</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.id})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Purchase date" error={errors.purchasing_date?.message}>
              <Input type="date" {...register('purchasing_date', { required: 'Purchase date is required.' })} />
            </Field>
            <Field label="Valid up to" error={errors.valid_up_to?.message}>
              <Input type="date" {...register('valid_up_to', { required: 'Valid-up-to date is required.' })} />
            </Field>
            <Field label="Price" error={errors.price?.message} className="sm:col-span-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                {...register('price', { required: 'Price is required.' })}
              />
            </Field>
          </div>
          <Button type="submit" disabled={mutation.isPending || membersQuery.isPending || policiesQuery.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save enrollment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
