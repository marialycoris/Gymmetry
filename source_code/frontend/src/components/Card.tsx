import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ children, title, action, className = '' }: CardProps) {
  return (
    <section className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {title && (
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gym-black">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}