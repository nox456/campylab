'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar Acción', 
  message = '¿Está seguro de continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmStyle = 'primary' // primary, danger
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>
            <XMarkIcon style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn btn-${confirmStyle}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
