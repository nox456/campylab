'use client';

import Pagination from '../components/Pagination';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

const mockMovements = [];

export default function Inventory() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' (Product), 'edit' (Product), 'input' (Stock/Lot), 'output' (Usage)
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('catalogo');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // To show lots details

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '', 
    minimo: '',
    unidad: '',
    proveedor: '', // Mapped to description
    // Lot/Stock specific
    cantidad: '',
    lote: '',
    vencimiento: '',
  });

  const [movementData, setMovementData] = useState({
    cantidad: '',
    motivo: '',
  });

  // Helper safe date formatter
  const formatDate = (dateValue) => {
    if (!dateValue) return '—';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '—'; 
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '—';
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      
      // Data now comes as Products with aggregated stock
      const mapped = data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo_barras || '—', 
        cantidad: parseInt(item.stock_total) || 0,
        minimo: item.stock_minimo,
        unidad: item.unidad_medida,
        proveedor: item.descripcion, 
        lotes: item.lotes_activos || [] // Add lots array for details view
      }));
      setInventory(mapped);
    } catch (err) {
      console.error(err);
      // setError('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
      try {
          const res = await fetch('/api/inventory/history');
          if (!res.ok) throw new Error('Error fetching history');
          const data = await res.json();
          setMovements(data);
      } catch(e) {
          console.error(e);
      }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Pagination Reset
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLowStock, activeTab]);

  const canCreate = hasPermission('inventory', 'create');
  const canUpdate = hasPermission('inventory', 'update');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !filterLowStock || item.cantidad < item.minimo;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = inventory.filter(i => i.cantidad < i.minimo).length;
  
  // Unified Pagination Calculation
  const currentList = activeTab === 'catalogo' ? filteredInventory : movements;
  const totalItems = currentList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = currentList.slice(startIndex, endIndex);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    
    // Clear form
    setFormData({
        nombre: '',
        codigo: '',
        minimo: '',
        unidad: '',
        proveedor: '',
        cantidad: '',
        lote: '',
        vencimiento: ''
    });

    if (mode === 'edit' && item) {
      setFormData({
         nombre: item.nombre,
         codigo: item.codigo === '—' ? '' : item.codigo,
         minimo: item.minimo,
         unidad: item.unidad,
         proveedor: item.proveedor,
         cantidad: '', // Edit product doesn't change stock
         lote: '',
         vencimiento: ''
      });
    }
    
    setMovementData({ cantidad: '', motivo: '', loteId: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalMode('add');
    setExpandedRow(null);
  };

  const handleSaveProduct = async () => {
    try {
      const url = modalMode === 'edit' ? `/api/inventory/${selectedItem.id}` : '/api/inventory';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      
      // Payload matches backend expectation for Product
      const payload = {
        nombre: formData.nombre,
        codigo: formData.codigo,
        descripcion: formData.proveedor, 
        unidad: formData.unidad,
        minimo: parseInt(formData.minimo) || 0,
        // Only for Creation: Initial stock
        cantidad: modalMode === 'add' ? (parseInt(formData.cantidad) || 0) : undefined,
        lote: modalMode === 'add' ? formData.lote : undefined,
        vencimiento: modalMode === 'add' ? (formData.vencimiento || null) : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error saving item');
      
      await fetchInventory();
      handleCloseModal();
      showToast(modalMode === 'edit' ? 'Producto actualizado' : 'Producto creado', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAddStock = async () => {
    if (!selectedItem) return;
    try {
        const payload = {
            lote: formData.lote,
            vencimiento: formData.vencimiento,
            cantidad: parseInt(formData.cantidad)
        };
        
        const res = await fetch(`/api/inventory/${selectedItem.id}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Error al agregar stock');
        await fetchInventory();
        handleCloseModal();
        showToast('Stock agregado exitosamente', 'success');
    } catch(e) {
        showToast(e.message, 'error');
    }
  }

  const handleOutput = async () => {
    if (!selectedItem) return;
    try {
        const payload = {
            cantidad: parseInt(movementData.cantidad),
            motivo: movementData.motivo,
            loteId: movementData.loteId || null // Optional manual lot selection
        };

        const res = await fetch(`/api/inventory/${selectedItem.id}/output`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error al registrar salida');
        }
        
        await fetchInventory();
        handleCloseModal();
        showToast('Salida registrada exitosamente', 'success');
    } catch(e) {
        showToast(e.message, 'error');
    }
  };

  const hasExpiredLots = (lotes) => {
    if (!lotes || lotes.length === 0) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return lotes.some(l => {
        if (!l.fecha_vencimiento || l.cantidad_actual <= 0) return false;
        const exp = new Date(l.fecha_vencimiento);
        return exp < today; 
    });
  };

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  return (
    <Layout title="Inventario">
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">{totalItems}</p>
              <p className="stat-card-label">Productos</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}>
              <ArchiveBoxIcon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilterLowStock(!filterLowStock)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value" style={{ color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {lowStockCount}
              </p>
              <p className="stat-card-label">Bajo Stock Minimo</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
              <ExclamationTriangleIcon style={{ width: '24px', height: '24px', color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }} />
            </div>
          </div>
        </div>

        {canCreate && (
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleOpenModal('add')}>
            <div style={{ textAlign: 'center' }}>
              <PlusIcon style={{ width: '32px', height: '32px', color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
              <p className="stat-card-label">Nuevo Producto</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button 
          className={`tab ${activeTab === 'catalogo' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          <ArchiveBoxIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Catalogo
        </button>
        <button 
          className={`tab ${activeTab === 'movimientos' ? 'active' : ''}`}
          onClick={() => {
              setActiveTab('movimientos');
              fetchHistory();
          }}
        >
          <ClockIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Movimientos
        </button>
      </div>

      {/* Movements Tab */}
      {activeTab === 'movimientos' && (
          <div className="card">
              <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table>
                      <thead>
                          <tr>
                              <th>Fecha</th>
                              <th>Producto</th>
                              <th>Lote</th>
                              <th>Tipo</th>
                              <th>Cantidad</th>
                              <th>Referencia</th>
                              <th>Usuario</th>
                          </tr>
                      </thead>
                      <tbody>
                          {paginatedItems.length === 0 ? (
                              <tr>
                                  <td colSpan="7" className="text-center p-4">
                                      <p className="text-muted">No hay movimientos registrados.</p>
                                  </td>
                              </tr>
                          ) : (
                              paginatedItems.map(m => (
                                  <tr key={m.id}>
                                      <td className="text-sm">{new Date(m.fecha).toLocaleString()}</td>
                                      <td style={{ fontWeight: 500 }}>{m.producto}</td>
                                      <td style={{ fontFamily: 'monospace' }}>{m.codigo_lote || '-'}</td>
                                      <td>
                                          <span className={`badge ${
                                              m.tipo === 'ENTRADA' ? 'badge-success' : 
                                              m.tipo === 'CONSUMO' ? 'badge-info' : 'badge-warning'
                                          }`}>
                                              {m.tipo}
                                          </span>
                                      </td>
                                      <td style={{ fontWeight: 600 }}>
                                          {m.tipo !== 'ENTRADA' ? '-' : '+'}{m.cantidad} {m.unidad}
                                      </td>
                                      <td className="text-sm text-muted">{m.referencia}</td>
                                      <td className="text-sm">{m.usuario}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
              
              {/* Pagination Control */}
              <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
              />
          </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalogo' && (
        <>
          {/* Header Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="search-box" style={{ width: '280px' }}>
                <MagnifyingGlassIcon />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className={`btn ${filterLowStock ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setFilterLowStock(!filterLowStock)}
              >
                <ExclamationTriangleIcon style={{ width: '18px', height: '18px' }} />
                {filterLowStock ? 'Ver todos' : 'Solo bajo stock'}
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="card">
            <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Codigo</th>
                    <th>Nombre</th>
                    <th>Stock Total</th>
                    <th>Minimo</th>
                    <th>Unidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                        <ArchiveBoxIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                        <p className="text-muted">No hay productos registrados.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map(item => {
                      const isLowStock = item.cantidad < item.minimo;
                      const hasLots = item.lotes && item.lotes.length > 0;
                      const expiredWarning = hasExpiredLots(item.lotes);

                      return (
                        <>
                        <tr key={item.id} style={{ backgroundColor: expandedRow === item.id ? 'var(--muted)' : 'inherit' }}>
                          <td>
                            {hasLots && (
                                <button onClick={() => toggleRow(item.id)} className="btn btn-sm" style={{ padding: '0.25rem' }}>
                                    <ChevronDownIcon style={{ width: '14px', height: '14px', transform: expandedRow === item.id ? 'rotate(180deg)' : 'rotate(0)' }} />
                                </button>
                            )}
                          </td>
                          <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{item.codigo}</td>
                          <td>
                            {item.nombre}
                            {expiredWarning && (
                                <span title="Lotes vencidos detectados" style={{ marginLeft: '0.5rem', color: 'var(--danger)', verticalAlign: 'middle' }}>
                                    <ExclamationTriangleIcon style={{ width: '16px', height: '16px', display: 'inline' }} />
                                </span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              fontWeight: 600, 
                              color: isLowStock ? 'var(--danger)' : 'var(--foreground)',
                              fontSize: '1.1em'
                            }}>
                              {item.cantidad}
                            </span>
                          </td>
                          <td className="text-muted">{item.minimo}</td>
                          <td>{item.unidad}</td>
                          <td>
                            {isLowStock ? (
                              <span className="badge badge-danger">Bajo Stock</span>
                            ) : (
                              <span className="badge badge-success">OK</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {canCreate && (
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleOpenModal('input', item)}
                                  title="Agregar Lote (Entrada)"
                                >
                                  <PlusIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                  Lote
                                </button>
                              )}
                              {canUpdate && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleOpenModal('output', item)}
                                    title="Salida General"
                                    style={{ backgroundColor: 'var(--warning)', color: 'white' }}
                                  >
                                    <ArrowDownIcon style={{ width: '14px', height: '14px' }} />
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleOpenModal('edit', item)}
                                    title="Editar Producto"
                                  >
                                    <PencilIcon style={{ width: '14px', height: '14px' }} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expandable Row for Lots */}
                        {expandedRow === item.id && hasLots && (
                            <tr>
                                <td colSpan="8" style={{ padding: 0 }}>
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem' }}>
                                        <table style={{ width: '100%', fontSize: '0.9em' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ paddingLeft: '2rem' }}>Lote</th>
                                                    <th>Vencimiento</th>
                                                    <th>Stock Lote</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {item.lotes.map(lot => (
                                                    <tr key={lot.id}>
                                                        <td style={{ paddingLeft: '2rem', fontFamily: 'monospace' }}>{lot.codigo_lote}</td>
                                                        <td>
                                                            {formatDate(lot.fecha_vencimiento)}
                                                            {new Date(lot.fecha_vencimiento) < new Date().setHours(0,0,0,0) && lot.cantidad_actual > 0 && (
                                                                <span style={{ color: 'var(--danger)', fontWeight: 'bold', marginLeft: '0.5rem', fontSize: '0.8em' }}>
                                                                    (LOTE VENCIDO)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{lot.cantidad_actual}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Control */}
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
            />
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' && 'Nuevo Producto'}
                {modalMode === 'edit' && 'Editar Producto'}
                {modalMode === 'input' && 'Ingresar Nuevo Lote'}
                {modalMode === 'output' && 'Salida de Material'}
              </h3>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              {/* Add/Edit Product Form */}
              {(modalMode === 'add' || modalMode === 'edit') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Codigo Barras</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unidad *</label>
                      <select
                        className="form-select"
                        value={formData.unidad}
                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="unid">Unidades</option>
                        <option value="mL">Mililitros (mL)</option>
                        <option value="L">Litros (L)</option>
                        <option value="g">Gramos (g)</option>
                        <option value="par">Pares</option>
                        <option value="caja">Cajas</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nombre del Producto *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripcion / Proveedor</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.proveedor}
                      onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    />
                  </div>
                    
                  <div className="form-group">
                    <label className="form-label">Stock Minimo Global *</label>
                     <input
                        type="number"
                        className="form-input"
                        value={formData.minimo}
                        onChange={(e) => setFormData({ ...formData, minimo: e.target.value })}
                        required
                      />
                  </div>

                  {modalMode === 'add' && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <p className="text-sm font-bold text-muted" style={{ marginBottom: '0.5rem' }}>Stock Inicial (Primer Lote)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Cantidad Inicial</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                />
                            </div>
                             <div className="form-group">
                                <label className="form-label">Codigo Lote</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lote}
                                    onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vencimiento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.vencimiento}
                                    onChange={(e) => setFormData({ ...formData, vencimiento: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add Input (New Lot) Form */}
              {modalMode === 'input' && selectedItem && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="alert alert-info">
                    Agregando stock a: <strong>{selectedItem.nombre}</strong>
                  </div>
                  
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Cantidad *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Codigo Lote *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.lote}
                                onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                     <div className="form-group">
                        <label className="form-label">Fecha Vencimiento</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.vencimiento}
                            onChange={(e) => setFormData({ ...formData, vencimiento: e.target.value })}
                        />
                    </div>
                </div>
              )}
              
               {modalMode === 'output' && selectedItem && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="alert alert-warning">
                    Registrando salida de: <strong>{selectedItem.nombre}</strong> <br/>
                    <small>Se descontará automáticamente del lote más antiguo.</small>
                  </div>
                  
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Cantidad a retirar *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={movementData.cantidad}
                                onChange={(e) => setMovementData({ ...movementData, cantidad: e.target.value })}
                                required
                                min="1"
                                max={selectedItem.cantidad}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lote a descontar</label>
                            <select
                                className="form-select"
                                value={movementData.loteId || ''}
                                onChange={(e) => setMovementData({ ...movementData, loteId: e.target.value })}
                            >
                                <option value="">Automático (Más antiguo primero)</option>
                                {selectedItem.lotes && selectedItem.lotes
                                    .filter(l => l.cantidad_actual > 0)
                                    .map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.codigo_lote} — Vence: {formatDate(l.fecha_vencimiento)} (Stock: {l.cantidad_actual})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Motivo *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={movementData.motivo}
                                onChange={(e) => setMovementData({ ...movementData, motivo: e.target.value })}
                                required
                                placeholder="Ej: Uso interno, Dañado, Vencido..."
                            />
                        </div>
                    </div>
                </div>
              )}

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              {(modalMode === 'add' || modalMode === 'edit') && (
                <button className="btn btn-primary" onClick={handleSaveProduct}>
                  {modalMode === 'add' ? 'Crear Producto' : 'Guardar Cambios'}
                </button>
              )}
              {modalMode === 'input' && (
                <button 
                  className="btn btn-success" 
                  onClick={handleAddStock}
                  disabled={!formData.cantidad || !formData.lote}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Registrar Ingreso
                </button>
              )}
              {modalMode === 'output' && (
                <button 
                  className="btn btn-warning" 
                  onClick={handleOutput}
                  disabled={!movementData.cantidad || !movementData.motivo}
                  style={{ backgroundColor: 'var(--warning)', color: 'white' }}
                >
                  <ArrowDownIcon style={{ width: '16px', height: '16px' }} />
                  Registrar Salida
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
