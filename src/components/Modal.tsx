import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({ children, onClose, label, className = '' }: { children: ReactNode; onClose?: () => void; label: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-label={label} onCancel={event => { event.preventDefault(); onClose?.(); }} onClick={event => { if (event.target === event.currentTarget) onClose?.(); }}>
    <div className="modal-inner">{onClose && <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={23} /></button>}{children}</div>
  </dialog>;
}
