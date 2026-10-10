import { X, ShieldAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => container.current?.querySelector<HTMLElement>('input, select, button')?.focus(), 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const elements = Array.from(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') || []);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div ref={container} role="dialog" aria-modal="true" aria-label={title} className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
             <ShieldAlert className="text-ssp-red" size={20} />
             <h3 className="text-sm font-black text-ssp-navy uppercase tracking-widest">{title}</h3>
          </div>
          <button aria-label="Fechar" onClick={onClose} className="text-gray-400 hover:text-ssp-navy transition-all p-2 hover:bg-white rounded-xl">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
