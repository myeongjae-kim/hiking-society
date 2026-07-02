import type { ReactNode } from 'react';

import { inlineButtonClassName } from './styles';

type ActionButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: 'danger';
  type?: 'button' | 'submit';
};

export function ActionButton({
  children,
  disabled = false,
  onClick,
  tone,
  type = 'button',
}: ActionButtonProps) {
  return (
    <button
      className={`${inlineButtonClassName} ${tone === 'danger' ? '!text-[var(--red)]' : ''} ${
        disabled ? 'cursor-not-allowed opacity-45' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
