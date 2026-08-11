"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, pending = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInitialButton = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>("[data-confirm-dialog]");
      const focusable = dialog?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusInitialButton);
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onCancel, open, pending]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target && !pending) onCancel(); }}>
      <section aria-describedby="confirm-dialog-description" aria-labelledby="confirm-dialog-title" aria-modal="true" className="confirm-dialog" data-confirm-dialog role="alertdialog">
        <div className="dialog-icon"><Icon name="warning" /></div>
        <div>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-description">{description}</p>
        </div>
        <div className="dialog-actions">
          <Button disabled={pending} onClick={onCancel} ref={cancelRef} variant="secondary">Cancel</Button>
          <Button disabled={pending} onClick={onConfirm} variant="danger">
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
