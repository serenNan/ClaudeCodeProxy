import { useState } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
    confirmText: '确认',
    cancelText: '取消'
  });
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    confirmText = '确认',
    cancelText = '取消'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmOptions({ title, message, confirmText, cancelText });
      setResolveRef(() => resolve);
      setShowConfirmModal(true);
    });
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (resolveRef) {
      resolveRef(true);
      setResolveRef(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    if (resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
  };

  return {
    showConfirmModal,
    confirmOptions,
    showConfirm,
    handleConfirm,
    handleCancel
  };
}