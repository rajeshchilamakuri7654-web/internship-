import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, setToastCallback } from '../hooks/useToast';
import type { Toast } from '../hooks/useToast';

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export function ToastContainer() {
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    setToastCallback(addToast);
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map((t: Toast) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', opacity: 0.7 }}
          >
            <X size={14} color="currentColor" />
          </button>
        </div>
      ))}
    </div>
  );
}
