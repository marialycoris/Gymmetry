import { createContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
