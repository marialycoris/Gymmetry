import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { OTHER_SPECIALIZATION, SPECIALIZATIONS } from '../lib/specializations';

interface SpecializationSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function SpecializationSelect({ label, value, onChange }: SpecializationSelectProps) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [other, setOther] = useState(value !== '' && !SPECIALIZATIONS.some((o) => o.title === value));
  const selected = SPECIALIZATIONS.find((o) => o.title === value);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = (title: string) => {
    setOpen(false);
    if (title === OTHER_SPECIALIZATION) {
      setOther(true);
      onChange('');
      return;
    }
    setOther(false);
    onChange(title);
  };

  return (
    <div className="flex flex-col mb-4">
      <label htmlFor={id} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      {other ? (
        <div>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter specialization"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent transition-shadow"
          />
          <button type="button" onClick={() => { setOther(false); onChange(''); }} className="mt-2 text-xs font-semibold text-blue-800 hover:underline">
            Choose from list instead
          </button>
        </div>
      ) : (
        <div className="relative" ref={wrapRef}>
          <button
            id={id}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent"
          >
            {selected ? (
              <span>
                <span className="block text-sm font-semibold text-gym-black">{selected.title}</span>
                <span className="block text-xs text-gray-500">{selected.description}</span>
              </span>
            ) : (
              <span className="text-gray-500">Select specialization</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
          </button>
          {open && (
            <div role="listbox" className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto custom-scrollbar rounded-lg border border-gray-200 bg-white shadow-xl">
              {SPECIALIZATIONS.map((option) => (
                <button
                  key={option.title}
                  type="button"
                  role="option"
                  aria-selected={option.title === value}
                  onClick={() => choose(option.title)}
                  className="block w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <span className="block text-sm font-semibold text-gym-black">{option.title}</span>
                  <span className="block text-xs text-gray-500">{option.description}</span>
                </button>
              ))}
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => choose(OTHER_SPECIALIZATION)}
                className="block w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="block text-sm font-semibold text-gym-black">Other</span>
                <span className="block text-xs text-gray-500">Enter a specialization that is not listed.</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
