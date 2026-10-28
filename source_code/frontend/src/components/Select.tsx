import { useId, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  const id = useId();
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      <select
        id={id}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent"
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}