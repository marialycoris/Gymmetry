import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

const navButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gym-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed';

export function Pagination({ page, totalPages, total, from, to, onPageChange, itemLabel = 'items' }: PaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-sm sm:flex-row">
      <p className="text-gray-500">
        Showing <span className="font-semibold text-gym-black">{from}</span>
        {'–'}
        <span className="font-semibold text-gym-black">{to}</span> of{' '}
        <span className="font-semibold text-gym-black">{total}</span> {itemLabel}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button type="button" className={navButton} onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="inline-flex h-9 w-9 items-center justify-center text-gray-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson ${
                  p === page ? 'bg-gym-crimson text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gym-black'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button type="button" className={navButton} onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
