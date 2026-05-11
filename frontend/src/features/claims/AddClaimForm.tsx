import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClaim, createClaimLineItem } from '@/features/claims/claims.api'
import { claimsQueryKey } from '@/features/claims/claims.keys'
import type { Claim, ClaimWithLinesFormValues } from '@/features/claims/types'
import { fetchPolicies } from '@/features/policies/policies.api'
import { policiesQueryKey } from '@/features/policies/policies.keys'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

const defaultLine = (): ClaimWithLinesFormValues['items'][number] => ({
  diagnosis_code: '',
  amount: '0.00',
})

const emptyForm: ClaimWithLinesFormValues = {
  policy: 0,
  claim_number: '',
  amount_cents: 0,
  items: [defaultLine()],
}

const claimFieldKeys: (keyof ClaimWithLinesFormValues)[] = ['policy', 'claim_number', 'amount_cents']

export function AddClaimForm() {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const policiesQuery = useQuery({
    queryKey: policiesQueryKey,
    queryFn: fetchPolicies,
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ClaimWithLinesFormValues>({ defaultValues: emptyForm })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const mutation = useMutation({
    mutationFn: async (values: ClaimWithLinesFormValues) => {
      const claim = await createClaim({
        policy: values.policy,
        claim_number: values.claim_number.trim(),
        amount_cents: values.amount_cents,
      })
      const lines = values.items.filter((row) => row.diagnosis_code.trim())
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i]
        try {
          await createClaimLineItem({
            claim: claim.id,
            diagnosis_code: row.diagnosis_code.trim(),
            amount: row.amount,
          })
        } catch (err) {
          const msg = getApiErrorMessage(err)
          const wrapped = new Error(
            `Claim “${claim.claim_number}” (ID ${claim.id}) was created, but line item ${i + 1} failed: ${msg}`,
          )
          wrapped.cause = err
          throw wrapped
        }
      }
      return claim
    },
    onSuccess: async (created: Claim) => {
      clearErrors()
      setSuccessMessage(`Claim created successfully: ${created.claim_number} (ID ${created.id}).`)
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
      reset({ ...emptyForm, items: [defaultLine()] })
    },
    onError: async (error: unknown) => {
      setSuccessMessage(null)
      if (error instanceof Error && error.message.includes('was created')) {
        setError('root', { message: error.message })
        await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
        return
      }

      const fieldErrors = getApiFieldErrors(error)
      const rootParts: string[] = []

      if (fieldErrors.non_field_errors) {
        rootParts.push(fieldErrors.non_field_errors)
      }

      let mapped = false
      for (const key of claimFieldKeys) {
        const msg = fieldErrors[key]
        if (msg) {
          setError(key, { message: msg })
          mapped = true
        }
      }

      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key === 'non_field_errors') continue
        if (claimFieldKeys.includes(key as keyof ClaimWithLinesFormValues)) continue
        rootParts.push(`${key}: ${msg}`)
      }

      if (rootParts.length === 0 && !mapped) {
        rootParts.push(getApiErrorMessage(error))
      }

      if (rootParts.length > 0) {
        setError('root', { message: rootParts.join(' ') })
      }
    },
  })

  const policies = policiesQuery.data ?? []
  const policyOptionsReady = !policiesQuery.isPending && !policiesQuery.isError

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add claim</CardTitle>
        <CardDescription>
          Creates the claim header first, then saves each line item against the new claim ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) => {
            setSuccessMessage(null)
            clearErrors()
            mutation.mutate(values)
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

          <fieldset className="space-y-4 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">Claim</legend>
            {policiesQuery.isError ? (
              <p className="text-sm text-destructive">
                {getApiErrorMessage(policiesQuery.error, 'Could not load policies for selection.')}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Policy" error={errors.policy?.message} className="sm:col-span-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  disabled={!policyOptionsReady || policies.length === 0}
                  {...register('policy', {
                    required: 'Policy is required.',
                    valueAsNumber: true,
                    validate: (v) => (Number.isFinite(v) && v > 0 ? true : 'Select a policy.'),
                  })}
                >
                  <option value={0}>{policiesQuery.isPending ? 'Loading policies…' : 'Select a policy'}</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID {p.id})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Claim number" error={errors.claim_number?.message} className="sm:col-span-2">
                <Input {...register('claim_number', { required: 'Claim number is required.' })} />
              </Field>
              <Field label="Amount (cents)" error={errors.amount_cents?.message}>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...register('amount_cents', {
                    required: 'Amount is required.',
                    valueAsNumber: true,
                    validate: (v) => (Number.isFinite(v) && v > 0 ? true : 'Enter a positive amount in cents.'),
                  })}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-semibold">Line items</legend>
              <Button type="button" variant="outline" size="sm" onClick={() => append(defaultLine())}>
                Add line item
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase text-muted-foreground">Line {index + 1}</span>
                    {fields.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Diagnosis code" error={errors.items?.[index]?.diagnosis_code?.message}>
                      <Input {...register(`items.${index}.diagnosis_code`)} placeholder="e.g. Z00" />
                    </Field>
                    <Field label="Amount" error={errors.items?.[index]?.amount?.message}>
                      <Input type="text" inputMode="decimal" {...register(`items.${index}.amount`)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Rows with an empty diagnosis code are skipped.</p>
          </fieldset>

          <Button type="submit" disabled={mutation.isPending || policies.length === 0}>
            {mutation.isPending ? 'Saving…' : 'Create claim & line items'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
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
