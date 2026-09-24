import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Drawer — Ember Noir right-edge drawer. Replaces centered rounded modals.
 * 480px, square corners, hairline leading edge, scrim + blur.
 * Logical properties (end-/border-s-) so it mirrors correctly in RTL.
 */
export default function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer = null,
  widthClass = "max-w-[480px]",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      {/* scrim */}
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px] cursor-default"
      />
      {/* panel */}
      <aside
        className={`absolute top-0 bottom-0 end-0 w-full ${widthClass} bg-surface border-s border-line flex flex-col animate-rise-in`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
          <div className="min-w-0">
            {eyebrow && <p className="micro mb-1.5">{eyebrow}</p>}
            {title && (
              <h2 className="font-display text-[20px] leading-tight font-medium tracking-[-0.02em] text-ink truncate">
                {title}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-xs border border-transparent flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 hover:border-line transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-line flex flex-wrap items-center justify-end gap-2 bg-canvas">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
