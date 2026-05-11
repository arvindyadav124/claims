import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createMember } from '@/features/members/members.api'
import { membersQueryKey } from '@/features/members/members.keys'
import type { Member, MemberCreatePayload } from '@/features/members/types'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

const emptyForm: MemberCreatePayload = {
  first_name: '',
  last_name: '',
  user: 0,
  dob: '',
  gender: 'm',
  mobile: '',
  address: '',
  distt: '',
  state: '',
  pincode: '',
}

const formFieldKeys: (keyof MemberCreatePayload)[] = [
  'first_name',
  'last_name',
  'user',
  'dob',
  'gender',
  'mobile',
  'address',
  'distt',
  'state',
  'pincode',
]

export function AddMemberForm() {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MemberCreatePayload>({ defaultValues: emptyForm })

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: async (member: Member) => {
      clearErrors()
      setSuccessMessage(
        `Member created successfully: ${member.first_name} ${member.last_name} (${member.email}) — ID ${member.id}.`,
      )
      await queryClient.invalidateQueries({ queryKey: membersQueryKey })
      reset(emptyForm)
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      const fieldErrors = getApiFieldErrors(error)
      const rootParts: string[] = []

      if (fieldErrors.non_field_errors) {
        rootParts.push(fieldErrors.non_field_errors)
      }

      let mappedField = false
      for (const key of formFieldKeys) {
        const msg = fieldErrors[key]
        if (msg) {
          setError(key, { message: msg })
          mappedField = true
        }
      }

      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key === 'non_field_errors') continue
        if (formFieldKeys.includes(key as keyof MemberCreatePayload)) continue
        rootParts.push(`${key}: ${msg}`)
      }

      if (rootParts.length === 0 && !mappedField) {
        rootParts.push(getApiErrorMessage(error))
      }

      if (rootParts.length > 0) {
        setError('root', { message: rootParts.join(' ') })
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Register member</CardTitle>
        <CardDescription>
          Links a <strong>User ID</strong> (existing account with no member profile yet) to profile details. Email comes
          from that user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            setSuccessMessage(null)
            clearErrors()
            mutation.mutate(sanitizePayload(values))
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={errors.first_name?.message}>
              <Input {...register('first_name', { required: 'First name is required.' })} autoComplete="given-name" />
            </Field>
            <Field label="Last name" error={errors.last_name?.message}>
              <Input {...register('last_name', { required: 'Last name is required.' })} autoComplete="family-name" />
            </Field>
            <Field label="User ID" error={errors.user?.message}>
              <Input
                type="number"
                min={1}
                step={1}
                {...register('user', {
                  required: 'User ID is required.',
                  valueAsNumber: true,
                  validate: (v) => (Number.isFinite(v) && v > 0 ? true : 'Enter a valid user ID.'),
                })}
              />
            </Field>
            <Field label="Date of birth" error={errors.dob?.message}>
              <Input type="date" {...register('dob', { required: 'Date of birth is required.' })} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('gender', { required: true })}
              >
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
            </Field>
            <Field label="Mobile" error={errors.mobile?.message}>
              <Input {...register('mobile', { required: 'Mobile is required.' })} autoComplete="tel" />
            </Field>
            <Field label="Address" className="sm:col-span-2" error={errors.address?.message}>
              <Input {...register('address')} />
            </Field>
            <Field label="District" error={errors.distt?.message}>
              <Input {...register('distt')} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <Input {...register('state')} />
            </Field>
            <Field label="Pincode" error={errors.pincode?.message}>
              <Input {...register('pincode')} />
            </Field>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Create member'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function sanitizePayload(values: MemberCreatePayload): MemberCreatePayload {
  const payload: MemberCreatePayload = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    user: values.user,
    dob: values.dob,
    gender: values.gender,
    mobile: values.mobile.trim(),
  }
  const address = values.address?.trim()
  const distt = values.distt?.trim()
  const state = values.state?.trim()
  const pincode = values.pincode?.trim()
  if (address) payload.address = address
  if (distt) payload.distt = distt
  if (state) payload.state = state
  if (pincode) payload.pincode = pincode
  return payload
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium leading-none">{label}</label>
      {children}
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
