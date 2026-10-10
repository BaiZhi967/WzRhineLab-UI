import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { useFormContext } from '@base-ui/react/internals/form-context';

/** Internal parts shared by Field and the choice controls; not exported from the package. */

export function LabelText({ label, required, optional }: { label: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <>
      <span>{label}</span>
      {required && (
        <span className="rl-field__required" aria-hidden="true">
          *
        </span>
      )}
      {optional && !required && <span className="rl-field__optional">（可选）</span>}
    </>
  );
}

export function FieldErrorMessage({
  error,
  match,
  name,
}: {
  error: React.ReactNode;
  match?: React.ComponentProps<typeof BaseField.Error>['match'];
  /** Field name: a message for it in `<Form errors>` (server-side) replaces `error` and always shows. */
  name?: string;
}) {
  const { errors } = useFormContext();
  const server = name != null && Object.hasOwn(errors, name) ? errors[name] : undefined;
  const serverText = Array.isArray(server) ? server.join(' ') : server;
  if (!serverText && error == null) return null;
  return (
    <BaseField.Error className="rl-field__error" match={serverText ? undefined : match}>
      <svg className="rl-field__error-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M8 1.75 15 14.25H1L8 1.75Z" />
        <path d="M8 6.5v3.25M8 11.75v.01" />
      </svg>
      <span>{serverText || error}</span>
    </BaseField.Error>
  );
}

/** Lets Checkbox / Radio know they sit inside a group and must not create their own Field. */
export const ChoiceGroupContext = React.createContext<'checkbox' | 'radio' | null>(null);
