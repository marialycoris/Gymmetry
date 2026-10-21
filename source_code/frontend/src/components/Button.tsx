import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  isLoading?: boolean;
}

export function Button({ children, variant = 'primary', size = 'md', isLoading, disabled, className = '', ...props }: ButtonProps) {
  const baseStyle = 'rounded-lg font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'py-1.5 px-3 text-sm', md: 'py-2.5 px-5' };
  const variants = {
    primary: 'bg-gym-crimson text-white hover:bg-red-600 focus-visible:ring-gym-crimson',
    secondary: 'bg-gray-200 text-gym-black hover:bg-gray-300 focus-visible:ring-gray-400',
    danger: 'bg-gym-maroon text-white hover:bg-red-900 focus-visible:ring-gym-maroon',
  };

  return (
    <button className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={isLoading || disabled} {...props}>
      {isLoading ? 'Working…' : children}
    </button>
  );
}