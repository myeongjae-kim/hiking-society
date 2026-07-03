import type { ReactNode } from 'react';

import { inlineButtonClassName } from './styles';

type ActionButtonProps = {
  children: ReactNode;
  ariaPressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  tone?: 'danger';
  type?: 'button' | 'submit';
};

export function ActionButton({
  children,
  ariaPressed,
  disabled = false,
  onClick,
  title,
  tone,
  type = 'button',
}: ActionButtonProps) {
  return (
    <button
      aria-pressed={ariaPressed}
      className={`${inlineButtonClassName} ${tone === 'danger' ? '!text-[var(--red)]' : ''} ${
        disabled ? 'cursor-not-allowed opacity-45' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      {children}
    </button>
  );
}
