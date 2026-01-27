'use client';

import Pagination from '../components/Pagination';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

export default function Users({ isEmbed = false }) {
  const { hasPermission } = useAuth(); // Assuming admin role check needed
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset pagination when users list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error saving user');
      }

      showToast(`Usuario ${editingUser ? 'actualizado' : 'creado'} exitosamente`, 'success');
      handleCloseModal();
      fetchUsers();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleEdit = (user) => {
    // Populate form
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      nombre: user.nombre || '',
      cedula: user.cedula || '',
      email: user.email || '',
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      password: '', // Leave empty to keep existing
      role: user.role || 'user'
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/status`, { method: 'PUT' });
      if (!res.ok) throw new Error('Error changing status');
      fetchUsers();
      setShowDeleteConfirm(null);
      showToast(
          showDeleteConfirm.activo ? 'Usuario desactivado exitosamente' : 'Usuario reactivado exitosamente',
          'success'
      );
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      direccion: '',
      password: '',
      role: 'user'
    });
  };

  // Pagination Logic
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const content = (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>CI / Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map(user => (
                <tr key={user.id} style={{ opacity: user.activo ? 1 : 0.6 }}>
                  <td>
                    <span className="font-medium">{user.username}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{user.nombre || 'Sin nombre'}</td>
                  <td>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted">CI: {user.cedula}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{user.role}</span>
                  </td>
                  <td>
                    {user.activo ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(user)}
                      >
                        <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button 
                        className={`btn btn-sm btn-outline ${user.activo ? 'text-danger' : 'text-success'}`}
                        onClick={() => setShowDeleteConfirm(user)}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                      >
                        {user.activo ? (
                          <NoSymbolIcon style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>X</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Usuario</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cedula</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.cedula}
                      onChange={e => setFormData({...formData, cedula: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="user">Usuario (Default)</option>
                      <option value="Admin">Admin</option>
                      <option value="Bioanalista">Bioanalista</option>
                      <option value="Asistente">Asistente</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefono</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.telefono}
                      onChange={e => setFormData({...formData, telefono: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {editingUser ? 'Password (Dejar en blanco para mantener)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Direccion</label>
                    <textarea
                      className="form-input"
                      value={formData.direccion}
                      onChange={e => setFormData({...formData, direccion: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
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
                  ? 'Esta seguro que desea desactivar este usuario? No podra iniciar sesion en el sistema.'
                  : 'Esta seguro que desea reactivar este usuario? Podra volver a acceder al sistema.'}
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
    </>
  );

  if (isEmbed) {
    return content;
  }

  return (
    <Layout title="Gestion de Usuarios">
      {content}
    </Layout>
  );
}
