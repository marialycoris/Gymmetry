import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  label: string;
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** A select with a built-in search box — for picking from long lists (e.g. members). */
export function SearchableSelect({ label, options, value, onChange, placeholder = 'Search…' }: SearchableSelectProps) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = (v: string | number) => {
    onChange(String(v));
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); choose(filtered[0].value); }
  };

  return (
    <div className="flex flex-col mb-4">
      <label htmlFor={id} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      <div className="relative" ref={wrapRef}>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? `${id}-list` : undefined}
          type="text"
          value={open ? query : selected?.label ?? ''}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
        {open && (
          <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto custom-scrollbar rounded-lg border border-gray-200 bg-white shadow-xl">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">No matches.</li>
            ) : filtered.map((o) => (
              <li key={o.value} role="option" aria-selected={String(o.value) === String(value)}>
                <button
                  type="button"
                  onClick={() => choose(o.value)}
                  className={`block w-full px-4 py-3 text-left text-sm font-semibold border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${String(o.value) === String(value) ? 'bg-red-50 text-gym-crimson' : 'text-gym-black'}`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
