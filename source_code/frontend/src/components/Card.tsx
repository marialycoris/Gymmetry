import type { ReactNode } from 'react';

type CardRadius = 'none' | 'sm' | 'md' | 'xl';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
  radius?: CardRadius;
  headerTone?: 'default' | 'maroon';
}

const RADIUS: Record<CardRadius, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  xl: 'rounded-xl',
};

const HEADER_RADIUS: Record<CardRadius, string> = {
  none: '',
  sm: 'rounded-t-sm',
  md: 'rounded-t-md',
  xl: 'rounded-t-xl',
};

export function Card({ children, title, action, className = '', radius = 'xl', headerTone = 'default' }: CardProps) {
  const maroon = headerTone === 'maroon';

  return (
    <section className={`bg-white border border-gray-200 ${RADIUS[radius]} ${className}`}>
      {title && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4 ${HEADER_RADIUS[radius]} ${
            maroon ? 'border-gym-maroon bg-gym-maroon text-white' : 'border-gray-100'
          }`}
        >
          <h2 className={`text-lg font-bold ${maroon ? 'text-white' : 'text-gym-black'}`}>{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}
