import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Breite des Dialogs (Tailwind max-w-Klasse). */
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl' };

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`card w-full ${sizeMap[size]} animate-fade-in flex max-h-[90vh] flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
          </div>
        )}
        <div className="scroll-area flex-1 p-6">{children}</div>
        {footer && <div className="border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
