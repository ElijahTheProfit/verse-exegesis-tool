import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './icons';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** 0 = base sheet, 1 = stacked above (e.g. etymology over word study). */
  level?: 0 | 1;
  children: ReactNode;
}

// Mobile-first bottom sheet: full-width, rounded top, slides up, backdrop, Esc to close.
export function Sheet({ open, onClose, title, subtitle, level = 0, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const z = level === 1 ? 'z-[60]' : 'z-50';

  return createPortal(
    <div className={`fixed inset-0 ${z} flex items-end justify-center sm:items-center`}>
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[88dvh] w-full max-w-content animate-slide-up flex-col rounded-t-3xl border border-border bg-surface shadow-2xl sm:mb-6 sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-start gap-3 border-b border-border px-5 pb-4 pt-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="truncate font-serif text-lg font-semibold leading-tight">{title}</h2>
            ) : null}
            {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <IconClose />
          </button>
        </div>
        <div className="safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
