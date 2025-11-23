import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }

    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = () => {
    onClose?.();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* overlay com blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={handleBackdropClick}
      />

      {/* caixa do modal */}
      <div
        className="relative z-10 w-full max-w-lg"
        onClick={handleContentClick}
      >
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-950/5 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 pt-4 pb-3">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true"/>
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* body */}
          <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
