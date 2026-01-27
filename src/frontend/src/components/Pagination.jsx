import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  onItemsPerPageChange, 
  totalItems,
  startIndex,
  endIndex 
}) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1rem', 
      borderTop: '1px solid var(--border)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      {/* Info Text */}
      <div className="text-sm text-muted">
        Mostrando <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{startIndex + 1}</span> a <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{Math.min(endIndex, totalItems)}</span> de <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{totalItems}</span> resultados
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Rows per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="text-sm text-muted">Filas por página:</span>
          <select 
            className="form-select" 
            style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
          </button>
          
          <span className="text-sm" style={{ margin: '0 0.5rem' }}>
            Página {currentPage} de {totalPages}
          </span>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
