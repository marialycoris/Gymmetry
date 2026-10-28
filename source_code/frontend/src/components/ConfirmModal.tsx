import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Notice } from './Widgets';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Can be async. The modal shows a loading state, then closes when it resolves. */
  onConfirm: () => void | Promise<unknown>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (busy) return; // don't dismiss mid-request
    setError('');
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.'); // stays open so the user can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} hideFooter>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="text-gray-700 mb-6">{message}</div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={busy}>{cancelLabel}</Button>
        <Button variant={variant} onClick={confirm} isLoading={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}