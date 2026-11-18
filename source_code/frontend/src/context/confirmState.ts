import { createContext, type ReactNode } from 'react';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

export type ConfirmAction = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmAction | undefined>(undefined);
