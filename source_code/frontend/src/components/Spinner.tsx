interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export function Spinner({ size = 'md', className = '', label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZES[size]} ${className}`}
    />
  );
}

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
}

export function LoadingOverlay({ show, label = 'Loading…' }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/75 backdrop-blur-[1px]"
    >
      <Spinner size="lg" className="text-gym-crimson" label={label} />
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </div>
  );
}
