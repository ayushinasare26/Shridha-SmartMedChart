import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'lg',
  className = '',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-white rounded-2xl w-full ${maxWidthClasses[maxWidth]} shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 max-h-[90vh] my-auto animate-in zoom-in-95 duration-150 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {(title || icon) && (
          <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
