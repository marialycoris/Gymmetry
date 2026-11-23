import { useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, type = 'text', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-bold text-gym-black mb-2">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${isPassword ? 'pr-12' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={props.disabled}
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            title={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gym-crimson focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson rounded-lg disabled:cursor-not-allowed disabled:text-gray-300"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
