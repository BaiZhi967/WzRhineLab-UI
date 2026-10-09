import * as React from 'react';

/**
 * Showcase-only form controls built on native inputs.
 * They are not part of @wzrhine/react; Field/Switch/Segmented land in M1/M2 with a headless ADR.
 */

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  hideLegend?: boolean;
}

export function Segmented<T extends string>({ legend, name, value, options, onChange, hideLegend }: SegmentedProps<T>) {
  return (
    <fieldset className="sc-segmented">
      <legend className={hideLegend ? 'sc-visually-hidden' : 'sc-control-label'}>{legend}</legend>
      <div className="sc-segmented__track">
        {options.map((option) => (
          <label key={option.value} className="sc-segmented__option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function Toggle({ label, checked, onChange, description }: ToggleProps) {
  const id = React.useId();
  return (
    <div className="sc-toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-describedby={description ? `${id}-d` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {description && (
        <span id={`${id}-d`} className="sc-toggle__description">
          {description}
        </span>
      )}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextField({ label, value, onChange }: TextFieldProps) {
  const id = React.useId();
  return (
    <div className="sc-field">
      <label className="sc-control-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="sc-input" type="text" value={value} onChange={(e) => onChange(e.currentTarget.value)} />
    </div>
  );
}
