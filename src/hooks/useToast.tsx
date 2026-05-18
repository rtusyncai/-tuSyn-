import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md
                ${t.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : ''}
                ${t.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : ''}
                ${t.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : ''}
              `}
            >
              <div className="shrink-0">
                {t.type === 'success' && <CheckCircle size={20} />}
                {t.type === 'error' && <AlertCircle size={20} />}
                {t.type === 'info' && <Info size={20} />}
              </div>
              <p className="flex-1 text-sm font-medium leading-relaxed">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
