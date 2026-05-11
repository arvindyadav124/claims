import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createPolicy, createPolicyItem } from '@/features/policies/policies.api'
import { policiesQueryKey } from '@/features/policies/policies.keys'
import type { PolicyWithItemsFormValues } from '@/features/policies/types'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

const defaultLine = (): PolicyWithItemsFormValues['items'][number] => ({
  diagnosis_code: '',
  max_percent_of_policy: 80,
  max_yearly_limit: '0.00',
  max_claims_per_year: 1,
})

const emptyForm: PolicyWithItemsFormValues = {
  name: '',
  price: '0.00',
  min_age: 0,
  max_age: 120,
  eligible_gender: 'both',
  total_cover: 5_000_000,
  items: [defaultLine()],
}

const policyFieldKeys: (keyof PolicyWithItemsFormValues)[] = [
  'name',
  'price',
  'min_age',
  'max_age',
  'eligible_gender',
  'total_cover',
]

export function AddPolicyForm() {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PolicyWithItemsFormValues>({ defaultValues: emptyForm })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const mutation = useMutation({
    mutationFn: async (values: PolicyWithItemsFormValues) => {
      const policy = await createPolicy({
        name: values.name.trim(),
        price: values.price,
        min_age: values.min_age,
        max_age: values.max_age,
        eligible_gender: values.eligible_gender,
        total_cover: values.total_cover,
      })
      const lines = values.items.filter((row) => row.diagnosis_code.trim())
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i]
        try {
          await createPolicyItem({
            policy: policy.id,
            diagnosis_code: row.diagnosis_code.trim(),
            max_percent_of_policy: row.max_percent_of_policy,
            max_yearly_limit: row.max_yearly_limit,
            max_claims_per_year: row.max_claims_per_year,
          })
        } catch (err) {
          const msg = getApiErrorMessage(err)
          const wrapped = new Error(
            `Policy “${policy.name}” (ID ${policy.id}) was created, but line item ${i + 1} failed: ${msg}`,
          )
          wrapped.cause = err
          throw wrapped
        }
      }
      return policy
    },
    onSuccess: async (policy) => {
      clearErrors()
      setSuccessMessage(`Policy created successfully: ${policy.name} (ID ${policy.id}).`)
      await queryClient.invalidateQueries({ queryKey: policiesQueryKey })
      reset({ ...emptyForm, items: [defaultLine()] })
    },
    onError: async (error: unknown) => {
      setSuccessMessage(null)
      if (error instanceof Error && error.message.includes('was created')) {
        setError('root', { message: error.message })
        await queryClient.invalidateQueries({ queryKey: policiesQueryKey })
        return
      }

      const fieldErrors = getApiFieldErrors(error)
      const rootParts: string[] = []

      if (fieldErrors.non_field_errors) {
        rootParts.push(fieldErrors.non_field_errors)
      }

      let mapped = false
      for (const key of policyFieldKeys) {
        const msg = fieldErrors[key]
        if (msg) {
          setError(key, { message: msg })
          mapped = true
        }
      }

      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key === 'non_field_errors') continue
        if (policyFieldKeys.includes(key as keyof PolicyWithItemsFormValues)) continue
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add policy</CardTitle>
        <CardDescription>Create the policy first, then any line items you add are saved against the new policy.</CardDescription>
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
            <legend className="mb-2 text-sm font-semibold">Policy</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name?.message} className="sm:col-span-2">
                <Input {...register('name', { required: 'Name is required.' })} />
              </Field>
              <Field label="Price" error={errors.price?.message}>
                <Input
                  type="text"
                  inputMode="decimal"
                  {...register('price', { required: 'Price is required.' })}
                />
              </Field>
              <Field label="Total cover" error={errors.total_cover?.message}>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...register('total_cover', {
                    required: 'Total cover is required.',
                    valueAsNumber: true,
                    validate: (v) => (Number.isFinite(v) && v >= 1 ? true : 'Enter a positive whole number.'),
                  })}
                />
                <p className="mt-1 text-xs text-muted-foreground">Maximum total coverage (integer amount).</p>
              </Field>
              <Field label="Eligible gender" error={errors.eligible_gender?.message}>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('eligible_gender', { required: true })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              <Field label="Min age" error={errors.min_age?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('min_age', { valueAsNumber: true, required: true })}
                />
              </Field>
              <Field label="Max age" error={errors.max_age?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('max_age', { valueAsNumber: true, required: true })}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-semibold">Line items</legend>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(defaultLine())}
              >
                Add line item
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase text-muted-foreground">Item {index + 1}</span>
                    {fields.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Diagnosis code" error={errors.items?.[index]?.diagnosis_code?.message}>
                      <Input {...register(`items.${index}.diagnosis_code`)} placeholder="e.g. A01" />
                    </Field>
                    <Field label="Max % of policy" error={errors.items?.[index]?.max_percent_of_policy?.message}>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...register(`items.${index}.max_percent_of_policy`, { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label="Max yearly limit" error={errors.items?.[index]?.max_yearly_limit?.message}>
                      <Input type="text" inputMode="decimal" {...register(`items.${index}.max_yearly_limit`)} />
                    </Field>
                    <Field label="Max claims / year" error={errors.items?.[index]?.max_claims_per_year?.message}>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...register(`items.${index}.max_claims_per_year`, { valueAsNumber: true })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Rows with an empty diagnosis code are skipped. You can add more items later from the API if needed.
            </p>
          </fieldset>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Create policy & line items'}
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
