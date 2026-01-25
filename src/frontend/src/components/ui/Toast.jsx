import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';

const toastStyles = {
  success: {
    bg: 'bg-[var(--success)]',
    text: 'text-white', // Consistent white text for better contrast on success green
    icon: <CheckCircleIcon className="w-5 h-5 text-white" />
  },
  error: {
    bg: 'bg-[var(--danger)]', 
    text: 'text-white',
    icon: <ExclamationCircleIcon className="w-5 h-5 text-white" />
  },
  warning: {
    bg: 'bg-[var(--warning)]',
    text: 'text-black', // Warning yellow usually needs black text
    icon: <ExclamationTriangleIcon className="w-5 h-5 text-black" />
  },
  info: {
    bg: 'bg-[var(--info)]',
    text: 'text-white',
    icon: <InformationCircleIcon className="w-5 h-5 text-white" />
  }
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToast();
  
    return (
      <div 
        style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            pointerEvents: 'none' // Allow clicks through container area
        }}
      >
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
                pointerEvents: 'auto',
                minWidth: '300px',
                maxWidth: '400px',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                animation: 'slideIn 0.3s ease-out forwards',
                backgroundColor: 'var(--card)', // Default background
                borderLeft: `4px solid var(--${toast.type === 'error' ? 'danger' : toast.type === 'warning' ? 'warning' : toast.type === 'success' ? 'success' : 'info'})`,
                color: 'var(--foreground)'
            }}
            className="toast-item"
          >
             <div style={{ flexShrink: 0, color: `var(--${toast.type === 'error' ? 'danger' : toast.type === 'warning' ? 'warning' : toast.type === 'success' ? 'success' : 'info'})` }}>
                 {toast.type === 'success' && <CheckCircleIcon style={{ width: '20px', height: '20px' }} />}
                 {toast.type === 'error' && <ExclamationCircleIcon style={{ width: '20px', height: '20px' }} />}
                 {toast.type === 'warning' && <ExclamationTriangleIcon style={{ width: '20px', height: '20px' }} />}
                 {toast.type === 'info' && <InformationCircleIcon style={{ width: '20px', height: '20px' }} />}
             </div>
             <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{toast.message}</p>
             <button onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                <XMarkIcon style={{ width: '16px', height: '16px' }} />
             </button>
          </div>
        ))}
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  };
