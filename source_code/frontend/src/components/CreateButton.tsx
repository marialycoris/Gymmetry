import type { ButtonHTMLAttributes } from 'react';
import { Plus } from 'lucide-react';

interface CreateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function CreateButton({ label = 'Add', className = '', ...props }: CreateButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${className}`}
      {...props}
    >
      <Plus className="h-5 w-5" />
      {label}
    </button>
  );
}
