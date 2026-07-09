import type { ReactNode } from 'react';

import { labelClassName } from './styles';

export function FieldLabel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className={labelClassName}>
      <span>{label}</span>
      {children}
    </label>
  );
}
