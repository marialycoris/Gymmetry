import { useState, type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Can be async. The modal shows a loading state, then closes when it resolves. */
  onConfirm: () => void | Promise<unknown>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  successMessage?: string;
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
  successMessage = 'Action completed.',
  variant = 'primary',
}: ConfirmModalProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} hideFooter isLoading={busy} loadingLabel="Working…">
      <div className="text-gray-700 mb-6">{message}</div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={busy}>{cancelLabel}</Button>
        <Button variant={variant} onClick={confirm} isLoading={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}