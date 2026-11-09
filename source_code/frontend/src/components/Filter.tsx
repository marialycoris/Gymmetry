import { useEffect, useRef, useState } from 'react';
import { Check, Funnel } from 'lucide-react';

export interface FilterOption {
  value: string | number;
  label: string;
}

interface FilterProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'header';
}

export function Filter({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  className = '',
  variant = 'default',
}: FilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => String(o.value) === String(value));
  const active = String(value) !== '';
  const dark = variant === 'header';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const triggerClass = dark
    ? 'border-transparent bg-transparent text-white hover:opacity-80'
    : open || active
      ? 'border-gym-crimson bg-red-50 text-gym-crimson'
      : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gym-black';

  return (
    <div className={`relative inline-block h-10 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label ?? 'Filter'}
        title={selected?.label ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors focus:outline-none ${
          dark ? 'focus-visible:ring-2 focus-visible:ring-white' : 'focus-visible:ring-2 focus-visible:ring-gym-crimson'
        } ${triggerClass}`}
      >
        <Funnel className="h-4 w-4" />
        {active && (
          <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${dark ? 'bg-white' : 'bg-gym-crimson'}`} />
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label ?? 'Filter options'}
          className="absolute right-0 z-20 mt-2 max-h-60 w-56 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((o) => {
            const isSelected = String(o.value) === String(value);
            return (
              <li key={o.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(String(o.value))}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none ${
                    isSelected ? 'bg-red-50 font-semibold text-gym-crimson' : 'text-gym-black hover:bg-gray-50'
                  }`}
                >
                  <span>{o.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
