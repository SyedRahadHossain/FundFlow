'use client';

import { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const focusableElementsSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(focusableElementsSelector);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => element.removeEventListener('keydown', handleTab);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  footer,
}) {
  const contentRef = useRef(null);
  const previousActiveElement = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      const cleanup = contentRef.current ? trapFocus(contentRef.current) : () => {};
      return () => {
        document.body.style.overflow = '';
        cleanup();
        previousActiveElement.current?.focus();
      };
    }
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (!closeOnEscape) return;
    if (e.key === 'Escape') onClose();
  }, [closeOnEscape, onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
  }, [closeOnOverlayClick, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fade-in'
      )}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          'relative w-full bg-surface rounded-2xl shadow-xl',
          'animate-scale-in',
          sizes[size],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-neutral-200">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-neutral-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    />
  );
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmText = 'OK',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <Button variant="primary" onClick={onClose} width="full">
          {confirmText}
        </Button>
      }
    />
  );
}