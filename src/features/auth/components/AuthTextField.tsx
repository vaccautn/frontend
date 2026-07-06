import type { ChangeEvent, HTMLInputTypeAttribute } from 'react'
import { Field, Input } from '@chakra-ui/react'

type AuthTextFieldProps = {
  id: string
  label: string
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  autoComplete: string
  error?: string
  type?: HTMLInputTypeAttribute
}

function AuthTextField({
  id,
  label,
  name,
  value,
  onChange,
  autoComplete,
  error,
  type = 'text',
}: AuthTextFieldProps) {
  return (
    <Field.Root invalid={Boolean(error)}>
      <Field.Label htmlFor={id}>{label}</Field.Label>
      <Input
        id={id}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  )
}

export default AuthTextField
