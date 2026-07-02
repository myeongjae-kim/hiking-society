import type { ReactNode } from 'react';

import { inlineButtonClassName } from './styles';

type ActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'danger';
  type?: 'button' | 'submit';
};

export function ActionButton({ children, onClick, tone, type = 'button' }: ActionButtonProps) {
  return (
    <button
      className={`${inlineButtonClassName} ${tone === 'danger' ? '!text-[var(--red)]' : ''}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
