import * as React from 'react';
import type { ButtonSize, ButtonVariant } from '@wzrhine/react';

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconEnd?: React.ReactNode;
}

/**
 * Navigation styled as a button. Showcase-only stopgap: @wzrhine/react has no polymorphic
 * Button yet (tracked for M1 alongside the headless ADR), and a <button> must not navigate.
 */
export function LinkButton({ variant = 'primary', size = 'md', iconEnd, children, className, ...rest }: LinkButtonProps) {
  return (
    <a {...rest} className={['rl-button', className].filter(Boolean).join(' ')} data-variant={variant} data-size={size}>
      <span className="rl-button__content">
        <span className="rl-button__label">{children}</span>
        {iconEnd && (
          <span className="rl-button__icon" aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </span>
    </a>
  );
}
