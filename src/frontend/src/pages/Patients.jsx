'use client';

import { useState } from 'react';
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
} from '@heroicons/react/24/outline';

// Mock patients data
const initialPatients = [
  { cedula: 12345678, nombre: 'Maria Garcia', fecha_nacimiento: '1985-03-15', telefono: '0412-1234567', direccion: 'Calle Principal 123', correo: 'maria@email.com', sexo: 'F', activo: true },
  { cedula: 23456789, nombre: 'Jose Rodriguez', fecha_nacimiento: '1978-07-22', telefono: '0414-7654321', direccion: 'Avenida Central 456', correo: 'jose@email.com', sexo: 'M', activo: true },
  { cedula: 34567890, nombre: 'Ana Martinez', fecha_nacimiento: '1990-11-08', telefono: '0416-9876543', direccion: 'Urbanizacion Los Pinos', correo: 'ana@email.com', sexo: 'F', activo: true },
  { cedula: 45678901, nombre: 'Carlos Lopez', fecha_nacimiento: '1965-02-28', telefono: '0424-1122334', direccion: 'Residencias El Sol', correo: 'carlos@email.com', sexo: 'M', activo: true },
  { cedula: 56789012, nombre: 'Laura Hernandez', fecha_nacimiento: '1995-09-12', telefono: '0412-5566778', direccion: 'Centro Comercial Plaza', correo: 'laura@email.com', sexo: 'F', activo: false },
];

export default function Patients() {
  const { hasPermission } = useAuth();
  const [patients, setPatients] = useState(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    correo: '',
    sexo: 'M',
  });

  const canCreate = hasPermission('patients', 'create');
  const canUpdate = hasPermission('patients', 'update');
  const canDelete = hasPermission('patients', 'delete');

  const filteredPatients = patients.filter(p => 
    p.cedula.toString().includes(searchTerm) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (patient = null) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({ ...patient });
    } else {
      setEditingPatient(null);
      setFormData({
        cedula: '',
        nombre: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        correo: '',
        sexo: 'M',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPatient) {
      setPatients(patients.map(p => 
        p.cedula === editingPatient.cedula ? { ...formData, activo: true } : p
      ));
    } else {
      setPatients([...patients, { ...formData, cedula: parseInt(formData.cedula), activo: true }]);
    }
    handleCloseModal();
  };

  const handleDeactivate = (cedula) => {
    setPatients(patients.map(p => 
      p.cedula === cedula ? { ...p, activo: false } : p
    ));
    setShowDeleteConfirm(null);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
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
        {canCreate && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            Nuevo Paciente
          </button>
        )}
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="table-container">
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
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <UserIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron pacientes</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.cedula}>
                    <td style={{ fontWeight: 500 }}>{patient.cedula}</td>
                    <td>{patient.nombre}</td>
                    <td>{calculateAge(patient.fecha_nacimiento)} anos</td>
                    <td>
                      <span className={`badge ${patient.sexo === 'M' ? 'badge-info' : 'badge-warning'}`}>
                        {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                      </span>
                    </td>
                    <td>{patient.telefono}</td>
                    <td>{patient.correo}</td>
                    <td>
                      <span className={`badge ${patient.activo ? 'badge-success' : 'badge-neutral'}`}>
                        {patient.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link 
                          to={`/pacientes/${patient.cedula}`}
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
                        {canDelete && patient.activo && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => setShowDeleteConfirm(patient.cedula)}
                            title="Desactivar"
                          >
                            <TrashIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                      disabled={editingPatient}
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
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmar Desactivacion</h3>
            </div>
            <div className="modal-body">
              <p>Esta seguro que desea desactivar este paciente? El paciente quedara inactivo pero su historial se mantendra.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => handleDeactivate(showDeleteConfirm)}>
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
