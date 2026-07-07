import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastIdCounter;
    const toast = { id, type, title, message, createdAt: Date.now() };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message, duration: 6000 }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

/* ──────────── Toast UI ──────────── */

const typeConfig = {
  success: { icon: '✓', color: 'var(--success)', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)' },
  error:   { icon: '✕', color: 'var(--error)',   bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)' },
  warning: { icon: '!', color: 'var(--warning)', bg: 'rgba(251, 191, 36, 0.12)',  border: 'rgba(251, 191, 36, 0.25)' },
  info:    { icon: 'i', color: 'var(--link-blue)', bg: 'rgba(56, 189, 248, 0.10)', border: 'rgba(56, 189, 248, 0.20)' },
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 380,
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => {
        const cfg = typeConfig[t.type] || typeConfig.info;
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              background: cfg.bg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${cfg.border}`,
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
            }}
            onClick={() => onDismiss(t.id)}
            role="alert"
          >
            {/* Icon */}
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: cfg.color,
              color: 'var(--surface-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
              marginTop: 1,
            }}>
              {cfg.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title && (
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                  lineHeight: 1.3,
                  marginBottom: t.message ? 2 : 0,
                }}>
                  {t.title}
                </div>
              )}
              {t.message && (
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--on-dark-mute)',
                  lineHeight: 1.4,
                }}>
                  {t.message}
                </div>
              )}
            </div>

            {/* Dismiss */}
            <div style={{
              color: 'var(--mute)',
              fontSize: '0.75rem',
              flexShrink: 0,
              marginTop: 2,
              opacity: 0.6,
            }}>
              ✕
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
