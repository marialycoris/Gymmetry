import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';
import { LoadingOverlay } from './Spinner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  hideFooter?: boolean; // hide the default Close button when the body has its own actions
  isLoading?: boolean; // show a spinner overlay while a request is in flight
  loadingLabel?: string;
}

export function Modal({ isOpen, onClose, title, children, hideFooter, isLoading, loadingLabel }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="relative bg-gym-bg rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex shrink-0 justify-between items-center px-6 py-4 bg-gym-maroon rounded-t-xl">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-white hover:text-gray-200 text-2xl font-bold leading-none">&times;</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="p-6">{children}</div>
        </div>
        {!hideFooter && (
          <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        )}
        <LoadingOverlay show={!!isLoading} label={loadingLabel} />
      </div>
    </div>
  );
}