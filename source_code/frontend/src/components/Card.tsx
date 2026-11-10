import type { ReactNode } from 'react';

type CardRadius = 'none' | 'sm' | 'md' | 'xl';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
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

export function Card({ children, title, icon, action, className = '', bodyClassName = '', radius = 'xl', headerTone = 'default' }: CardProps) {
  const maroon = headerTone === 'maroon';

  return (
    <section className={`bg-white border border-gray-200 ${RADIUS[radius]} ${className}`}>
      {title && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4 ${HEADER_RADIUS[radius]} ${
            maroon ? 'border-gym-maroon bg-gym-maroon text-white' : 'border-gray-100'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className={`shrink-0 ${maroon ? 'text-white' : 'text-gym-crimson'}`}>{icon}</span>}
            <h2 className={`truncate text-lg font-bold ${maroon ? 'text-white' : 'text-gym-black'}`}>{title}</h2>
          </div>
          {action}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
