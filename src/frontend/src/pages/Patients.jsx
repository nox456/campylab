'use client';

import Pagination from '../components/Pagination';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router/Router';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

export default function Patients() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    email: '',
    sexo: 'M',
  });

  const canCreate = hasPermission('patients', 'create');
  const canUpdate = hasPermission('patients', 'update');
  const canDelete = hasPermission('patients', 'delete');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Error al cargar la lista de pacientes.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.cedula.toString().includes(searchTerm) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenModal = (patient = null) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        nombre: patient.nombre,
        cedula: patient.cedula,
        telefono: patient.telefono || '',
        direccion: patient.direccion || '',
        email: patient.email || '',
        sexo: patient.sexo || 'M',
        // Convert ISO string to YYYY-MM-DD for input type="date"
        fecha_nacimiento: patient.fecha_nacimiento ? patient.fecha_nacimiento.split('T')[0] : '',
      });
    } else {
      setEditingPatient(null);
      setFormData({
        cedula: '',
        nombre: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        email: '',
        sexo: 'M',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPatient 
        ? `/api/patients/${editingPatient.id}`
        : '/api/patients';
      
      const method = editingPatient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      await fetchPatients(); // Refresh list
      handleCloseModal();
      showToast(editingPatient ? 'Paciente actualizado exitosamente' : 'Paciente creado exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`/api/patients/${id}/status`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to update patient status');

      await fetchPatients(); // Refresh list
      setShowDeleteConfirm(null);
      showToast(
          showDeleteConfirm.activo ? 'Paciente desactivado exitosamente' : 'Paciente reactivado exitosamente',
          'success'
      );
    } catch (err) {
      showToast(`Error al actualizar estado del paciente: ${err.message}`, 'error');
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    // Check for invalid date
    if (isNaN(birth.getTime())) return 'N/A';
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Layout title="Pacientes">
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-box" style={{ width: '300px' }}>
          <MagnifyingGlassIcon />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por cedula o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          Nuevo Paciente
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Patients Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
             <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando pacientes...</div>
          ) : (
          <table>
            <thead>
              <tr>
                <th>Cedula</th>
                <th>Nombre</th>
                <th>Edad</th>
                <th>Sexo</th>
                <th>Telefono</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <UserIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron pacientes</p>
                  </td>
                </tr>
              ) : (
                currentPatients.map(patient => (
                  <tr key={patient.id} style={{ opacity: patient.activo ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{patient.cedula}</td>
                    <td>{patient.nombre}</td>
                    <td>{calculateAge(patient.fecha_nacimiento)} Años</td>
                    <td>
                      <span className={`badge ${patient.sexo === 'M' ? 'badge-info' : 'badge-warning'}`}>
                        {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                      </span>
                    </td>
                    <td>{patient.telefono}</td>
                    <td>{patient.email}</td>
                    <td>
                      <span className={`badge ${patient.activo ? 'badge-success' : 'badge-neutral'}`}>
                        {patient.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link 
                          to={`/pacientes/${patient.id}`}
                          className="btn btn-sm btn-outline"
                          title="Ver historial"
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        </Link>
                        {canUpdate && (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenModal(patient)}
                            title="Editar"
                          >
                            <PencilIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                        {patient.activo ? (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => setShowDeleteConfirm(patient)}
                            title="Desactivar"
                          >
                            <TrashIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => setShowDeleteConfirm(patient)}
                            title="Reactivar"
                            style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                          >
                            <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h3>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Cedula *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      required
                      disabled={!!editingPatient}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexo *</label>
                    <select
                      className="form-select"
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                      required
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefono</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Correo Electronico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Direccion</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPatient ? 'Guardar Cambios' : 'Crear Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {showDeleteConfirm.activo ? 'Confirmar Desactivacion' : 'Confirmar Reactivacion'}
              </h3>
            </div>
            <div className="modal-body">
              <p>
                {showDeleteConfirm.activo 
                  ? 'Esta seguro que desea desactivar este paciente? El registro se mantendra pero no podra ser utilizado para nuevas ordenes.'
                  : 'Esta seguro que desea reactivar este paciente? Podra volver a crear ordenes para el.'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancelar
              </button>
              <button 
                className={`btn ${showDeleteConfirm.activo ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleToggleStatus(showDeleteConfirm.id)}
              >
                {showDeleteConfirm.activo ? 'Desactivar' : 'Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
