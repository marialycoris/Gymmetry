import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'header';
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className = '',
  variant = 'default',
}: SearchBarProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = value.length > 0;
  const dark = variant === 'header';

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const triggerClass = dark
    ? `border-transparent bg-transparent ${open ? 'text-gray-500' : 'text-white hover:opacity-80'}`
    : open
      ? 'border-transparent bg-transparent text-gray-500'
      : active
        ? 'border-gym-crimson bg-white text-gym-crimson'
        : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gym-black';

  const widthClass = open ? (dark ? 'w-40 sm:w-56' : 'w-56 sm:w-64') : 'w-10';

  return (
    <div className={`relative h-10 ${widthClass} transition-[width] duration-200 ease-out ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        tabIndex={open ? 0 : -1}
        className={`h-10 w-full rounded-md border bg-white pl-10 pr-9 text-sm text-gym-black transition-opacity duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gym-crimson ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        } ${active ? 'border-gym-crimson' : 'border-gray-300'}`}
      />
      <button
        type="button"
        onClick={() => {
          if (open) inputRef.current?.focus();
          else setOpen(true);
        }}
        aria-label={label ?? 'Search'}
        aria-expanded={open}
        className={`absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors focus:outline-none ${
          dark ? 'focus-visible:ring-2 focus-visible:ring-white' : 'focus-visible:ring-2 focus-visible:ring-gym-crimson'
        } ${triggerClass}`}
      >
        <Search className="h-4 w-4" />
        {!open && active && (
          <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${dark ? 'bg-white' : 'bg-gym-crimson'}`} />
        )}
      </button>
      {open && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (value) {
              onChange('');
              inputRef.current?.focus();
            } else {
              setOpen(false);
            }
          }}
          aria-label={value ? 'Clear search' : 'Close search'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gym-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
