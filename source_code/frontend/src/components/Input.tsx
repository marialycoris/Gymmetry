import { useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      <input
        id={id}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent transition-shadow"
        {...props}
      />
    </div>
  );
}