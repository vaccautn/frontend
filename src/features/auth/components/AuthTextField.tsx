import type { ChangeEvent, HTMLInputTypeAttribute } from 'react'

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
  const errorId = `${id}-error`

  return (
    <label className="field">
      <span>{label}</span>
      <input
        id={id}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  )
}

export default AuthTextField
