'use client';

import { useState } from 'react';
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
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Mock inventory data
const initialInventory = [
  { id: 1, nombre: 'Tubos EDTA', codigo: 'TUB-001', cantidad: 15, minimo: 50, unidad: 'unid', proveedor: 'Medical Supplies', lote: 'L2024-001', vencimiento: '2026-06-15' },
  { id: 2, nombre: 'Tubos Tapa Roja', codigo: 'TUB-002', cantidad: 120, minimo: 50, unidad: 'unid', proveedor: 'Medical Supplies', lote: 'L2024-002', vencimiento: '2026-08-20' },
  { id: 3, nombre: 'Reactivo Glucosa', codigo: 'REA-001', cantidad: 8, minimo: 20, unidad: 'mL', proveedor: 'BioReagents Inc', lote: 'R2024-015', vencimiento: '2025-12-01' },
  { id: 4, nombre: 'Reactivo Colesterol', codigo: 'REA-002', cantidad: 45, minimo: 30, unidad: 'mL', proveedor: 'BioReagents Inc', lote: 'R2024-016', vencimiento: '2025-11-15' },
  { id: 5, nombre: 'Lancetas', codigo: 'LAN-001', cantidad: 25, minimo: 100, unidad: 'unid', proveedor: 'Medical Supplies', lote: 'L2024-030', vencimiento: '2027-01-01' },
  { id: 6, nombre: 'Guantes Latex (M)', codigo: 'GUA-001', cantidad: 200, minimo: 100, unidad: 'par', proveedor: 'SafetyFirst', lote: 'G2024-055', vencimiento: '2026-03-01' },
  { id: 7, nombre: 'Alcohol Isopropilico', codigo: 'ALC-001', cantidad: 5, minimo: 10, unidad: 'L', proveedor: 'ChemLab', lote: 'A2024-012', vencimiento: '2025-09-30' },
  { id: 8, nombre: 'Algodones', codigo: 'ALG-001', cantidad: 500, minimo: 200, unidad: 'g', proveedor: 'Medical Supplies', lote: 'L2024-100', vencimiento: '2027-06-01' },
  { id: 9, nombre: 'Reactivo Urea', codigo: 'REA-003', cantidad: 60, minimo: 30, unidad: 'mL', proveedor: 'BioReagents Inc', lote: 'R2024-020', vencimiento: '2025-10-15' },
  { id: 10, nombre: 'Reactivo Creatinina', codigo: 'REA-004', cantidad: 55, minimo: 30, unidad: 'mL', proveedor: 'BioReagents Inc', lote: 'R2024-021', vencimiento: '2025-10-15' },
];

const mockMovements = [
  { id: 1, item: 'Tubos EDTA', tipo: 'salida', cantidad: 5, fecha: '2025-01-18 10:30', usuario: 'Ana Bioanalista', motivo: 'Orden #0001' },
  { id: 2, item: 'Reactivo Glucosa', tipo: 'salida', cantidad: 2, fecha: '2025-01-18 09:15', usuario: 'Ana Bioanalista', motivo: 'Orden #0003' },
  { id: 3, item: 'Guantes Latex (M)', tipo: 'entrada', cantidad: 100, fecha: '2025-01-17 14:00', usuario: 'Admin Usuario', motivo: 'Compra' },
  { id: 4, item: 'Lancetas', tipo: 'salida', cantidad: 10, fecha: '2025-01-17 11:30', usuario: 'Ana Bioanalista', motivo: 'Orden #0004' },
  { id: 5, item: 'Alcohol Isopropilico', tipo: 'entrada', cantidad: 3, fecha: '2025-01-16 16:00', usuario: 'Admin Usuario', motivo: 'Compra' },
];

export default function Inventory() {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState(initialInventory);
  const [movements] = useState(mockMovements);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'input', 'output'
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('catalogo');
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    cantidad: '',
    minimo: '',
    unidad: '',
    proveedor: '',
    lote: '',
    vencimiento: '',
  });

  const [movementData, setMovementData] = useState({
    cantidad: '',
    motivo: '',
  });

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
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((acc, i) => acc + i.cantidad, 0);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    if (mode === 'edit' && item) {
      setFormData({ ...item });
    } else if (mode === 'add') {
      setFormData({
        nombre: '',
        codigo: '',
        cantidad: '',
        minimo: '',
        unidad: '',
        proveedor: '',
        lote: '',
        vencimiento: '',
      });
    }
    setMovementData({ cantidad: '', motivo: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalMode('add');
  };

  const handleSaveItem = () => {
    if (modalMode === 'add') {
      const newItem = {
        ...formData,
        id: inventory.length + 1,
        cantidad: parseInt(formData.cantidad) || 0,
        minimo: parseInt(formData.minimo) || 0,
      };
      setInventory([...inventory, newItem]);
    } else if (modalMode === 'edit') {
      setInventory(inventory.map(i => 
        i.id === selectedItem.id ? { ...formData, cantidad: parseInt(formData.cantidad), minimo: parseInt(formData.minimo) } : i
      ));
    }
    handleCloseModal();
  };

  const handleMovement = () => {
    const cantidad = parseInt(movementData.cantidad);
    if (!cantidad || cantidad <= 0) return;

    setInventory(inventory.map(i => {
      if (i.id === selectedItem.id) {
        const newCantidad = modalMode === 'input' 
          ? i.cantidad + cantidad 
          : Math.max(0, i.cantidad - cantidad);
        return { ...i, cantidad: newCantidad };
      }
      return i;
    }));
    handleCloseModal();
  };

  const isExpiringSoon = (vencimiento) => {
    const today = new Date();
    const expDate = new Date(vencimiento);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
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
              <p className="stat-card-label">Items en Catalogo</p>
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
              <p className="stat-card-label">Agregar Material</p>
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
          onClick={() => setActiveTab('movimientos')}
        >
          <ClockIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Movimientos
        </button>
      </div>

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
                  placeholder="Buscar por nombre o codigo..."
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
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Minimo</th>
                    <th>Unidad</th>
                    <th>Lote</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                        <ArchiveBoxIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                        <p className="text-muted">No se encontraron items</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      const isLowStock = item.cantidad < item.minimo;
                      const expiringSoon = isExpiringSoon(item.vencimiento);
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{item.codigo}</td>
                          <td>{item.nombre}</td>
                          <td>
                            <span style={{ 
                              fontWeight: 600, 
                              color: isLowStock ? 'var(--danger)' : 'var(--foreground)' 
                            }}>
                              {item.cantidad}
                            </span>
                          </td>
                          <td className="text-muted">{item.minimo}</td>
                          <td>{item.unidad}</td>
                          <td className="text-sm">{item.lote}</td>
                          <td>
                            <span className={expiringSoon ? 'text-sm' : 'text-sm'} style={{ color: expiringSoon ? 'var(--warning)' : undefined }}>
                              {item.vencimiento}
                              {expiringSoon && (
                                <ExclamationTriangleIcon style={{ width: '14px', height: '14px', marginLeft: '0.25rem', verticalAlign: 'middle' }} />
                              )}
                            </span>
                          </td>
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
                                  title="Entrada"
                                >
                                  <ArrowUpIcon style={{ width: '14px', height: '14px' }} />
                                </button>
                              )}
                              {canUpdate && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleOpenModal('output', item)}
                                    title="Salida"
                                    style={{ backgroundColor: 'var(--warning)', color: 'white' }}
                                  >
                                    <ArrowDownIcon style={{ width: '14px', height: '14px' }} />
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleOpenModal('edit', item)}
                                    title="Editar"
                                  >
                                    <PencilIcon style={{ width: '14px', height: '14px' }} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Movements Tab */}
      {activeTab === 'movimientos' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Historial de Movimientos</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(mov => (
                  <tr key={mov.id}>
                    <td>
                      <div>
                        <p className="text-sm">{mov.fecha.split(' ')[0]}</p>
                        <p className="text-xs text-muted">{mov.fecha.split(' ')[1]}</p>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{mov.item}</td>
                    <td>
                      <span 
                        className={`badge ${mov.tipo === 'entrada' ? 'badge-success' : 'badge-warning'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpIcon style={{ width: '12px', height: '12px' }} />
                        ) : (
                          <ArrowDownIcon style={{ width: '12px', height: '12px' }} />
                        )}
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: mov.tipo === 'entrada' ? 'var(--success)' : 'var(--warning)' }}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </span>
                    </td>
                    <td>{mov.motivo}</td>
                    <td className="text-sm text-muted">{mov.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: modalMode === 'add' || modalMode === 'edit' ? '500px' : '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' && 'Agregar Material'}
                {modalMode === 'edit' && 'Editar Material'}
                {modalMode === 'input' && 'Registrar Entrada'}
                {modalMode === 'output' && 'Registrar Salida'}
              </h3>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              {(modalMode === 'add' || modalMode === 'edit') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Codigo *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        required
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
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Cantidad Actual</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Minimo *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.minimo}
                        onChange={(e) => setFormData({ ...formData, minimo: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Proveedor</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.proveedor}
                      onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Lote</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.lote}
                        onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                      />
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
                </div>
              )}

              {(modalMode === 'input' || modalMode === 'output') && selectedItem && (
                <div>
                  <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                    <strong>{selectedItem.nombre}</strong><br />
                    Stock actual: <strong>{selectedItem.cantidad} {selectedItem.unidad}</strong>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={modalMode === 'input' ? 'Cantidad a ingresar' : 'Cantidad a retirar'}
                      value={movementData.cantidad}
                      onChange={(e) => setMovementData({ ...movementData, cantidad: e.target.value })}
                      min="1"
                      max={modalMode === 'output' ? selectedItem.cantidad : undefined}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Motivo *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={modalMode === 'input' ? 'Ej: Compra, Donacion' : 'Ej: Orden #0001, Calibracion'}
                      value={movementData.motivo}
                      onChange={(e) => setMovementData({ ...movementData, motivo: e.target.value })}
                      required
                    />
                  </div>

                  {modalMode === 'input' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Lote (opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Numero de lote"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Vencimiento (opcional)</label>
                        <input
                          type="date"
                          className="form-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              {(modalMode === 'add' || modalMode === 'edit') && (
                <button className="btn btn-primary" onClick={handleSaveItem}>
                  {modalMode === 'add' ? 'Agregar' : 'Guardar Cambios'}
                </button>
              )}
              {modalMode === 'input' && (
                <button 
                  className="btn btn-success" 
                  onClick={handleMovement}
                  disabled={!movementData.cantidad || !movementData.motivo}
                >
                  <ArrowUpIcon style={{ width: '16px', height: '16px' }} />
                  Registrar Entrada
                </button>
              )}
              {modalMode === 'output' && (
                <button 
                  className="btn btn-warning" 
                  onClick={handleMovement}
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
