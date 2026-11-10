import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  const id = useId();
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      <div className="relative">
        <select
          id={id}
          className="w-full appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          {...props}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      </div>
    </div>
  );
}
