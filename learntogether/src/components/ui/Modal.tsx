"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons rendered along the bottom. */
  footer?: ReactNode;
}

/**
 * A confirmation dialog built on `<dialog>`, so focus trapping and Escape come
 * from the platform rather than hand-rolled key handling.
 */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,32rem)] rounded-card bg-surface p-0 text-ink shadow-raised backdrop:bg-black/40"
    >
      <div className="flex items-center gap-4 p-5 pb-2">
        <h2 id="modal-title" className="flex-1 text-2xl font-extrabold">
          {title}
        </h2>
        <IconButton icon="close" label="Close" tone="quiet" onClick={onClose} />
      </div>
      <div className="px-5 pb-5 text-lg text-ink-muted">{children}</div>
      {footer && <div className="flex flex-col gap-3 p-5 pt-0 sm:flex-row">{footer}</div>}
    </dialog>
  );
}
