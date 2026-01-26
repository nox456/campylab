import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  BeakerIcon,
  TagIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

export default function Exams() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('examenes'); // 'examenes' or 'categorias'
  
  // Data States
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('exam'); // 'exam' or 'category'

  // Forms
  const [categoryForm, setCategoryForm] = useState({ nombre: '', muestra: '' });
  const [examForm, setExamForm] = useState({
    nombre: '',
    id_categoria_examen: '',
    precio: '',
    detalles: [] // Array of { nombre, unidad, valor_min, valor_max }
  });

  // Permissions
  const isSuperAdmin = user?.role === 'super_admin';
  const canCreate = isSuperAdmin || hasPermission('results', 'create'); 
  const canDelete = isSuperAdmin || hasPermission('results', 'delete');

  useEffect(() => {
    fetchExams();
    fetchCategories();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) setExams(await res.json());
    } catch (e) {
      console.error(e);
      setError('Error al cargar examenes');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/exams/categories');
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
      setError('Error al cargar categorias');
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    if (type === 'category') {
      setCategoryForm({ nombre: '', muestra: '' });
    } else {
      setExamForm({
        nombre: '',
        id_categoria_examen: '',
        precio: '',
        detalles: [{ nombre: '', unidad: '', valor_min: '', valor_max: '' }] // Start with one empty row
      });
    }
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/exams/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error('Error creating category');
      
      await fetchCategories();
      setShowModal(false);
      showToast('Categoria creada exitosamente', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    // Validate details
    if (examForm.detalles.length === 0) {
      showToast('Debe agregar al menos un parametro al examen', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error creating exam');
      }

      await fetchExams();
      setShowModal(false);
      showToast('Examen creado exitosamente', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Esta seguro que desea eliminar este elemento?')) return;
    try {
      const endpoint = type === 'category' ? `/api/exams/categories/${id}` : `/api/exams/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || 'Error deleting item');
      }

      if (type === 'category') await fetchCategories();
      else await fetchExams();
      showToast('Elemento eliminado exitosamente', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Helper to manage dynamic detail rows
  const updateDetail = (index, field, value) => {
    const newDetails = [...examForm.detalles];
    newDetails[index][field] = value;
    setExamForm({ ...examForm, detalles: newDetails });
  };

  const addDetailRow = () => {
    setExamForm({
      ...examForm,
      detalles: [...examForm.detalles, { nombre: '', unidad: '', valor_min: '', valor_max: '' }]
    });
  };

  const removeDetailRow = (index) => {
    const newDetails = examForm.detalles.filter((_, i) => i !== index);
    setExamForm({ ...examForm, detalles: newDetails });
  };

  return (
    <Layout title="Gestion de Examenes">
       <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button 
          className={`tab ${activeTab === 'examenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('examenes')}
        >
          <BeakerIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Examenes
        </button>
        <button 
          className={`tab ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          <TagIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Categorias
        </button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        {canCreate && (
           <button 
             className="btn btn-primary"
             onClick={() => handleOpenModal(activeTab === 'examenes' ? 'exam' : 'category')}
           >
             <PlusIcon style={{ width: '18px', height: '18px' }} />
             {activeTab === 'examenes' ? 'Nuevo Examen' : 'Nueva Categoria'}
           </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          {activeTab === 'categorias' ? (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo de Muestra</th>
                  <th style={{ width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.nombre}</td>
                    <td>{cat.muestra}</td>
                    <td>
                      {canDelete && (
                         <button 
                           className="btn btn-sm btn-danger" 
                           onClick={() => handleDelete('category', cat.id)}
                           title="Eliminar"
                         >
                           <TrashIcon style={{ width: '14px', height: '14px' }} />
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Muestra</th>
                  <th>Precio</th>
                  <th style={{ width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(exam => (
                  <tr key={exam.id}>
                    <td style={{ fontWeight: 500 }}>{exam.nombre}</td>
                    <td>
                       <span className="badge badge-neutral">{exam.categoria_nombre}</span>
                    </td>
                    <td>{exam.muestra}</td>
                    <td>${exam.precio}</td>
                    <td>
                      {canDelete && (
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleDelete('exam', exam.id)}
                          title="Eliminar"
                        >
                           <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
           <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: modalType === 'exam' ? '800px' : '400px' }}>
              <div className="modal-header">
                <h3>{modalType === 'category' ? 'Nueva Categoria' : 'Nuevo Examen'}</h3>
                <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              <form onSubmit={modalType === 'category' ? handleSaveCategory : handleSaveExam}>
                <div className="modal-body">
                  {modalType === 'category' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Nombre de Categoria</label>
                        <input className="form-input" required 
                          value={categoryForm.nombre} onChange={e => setCategoryForm({...categoryForm, nombre: e.target.value})} 
                        />
                      </div>
                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Tipo de Muestra (Default)</label>
                        <input className="form-input" required placeholder="Ej: Sangre, Orina"
                          value={categoryForm.muestra} onChange={e => setCategoryForm({...categoryForm, muestra: e.target.value})}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                           <label className="form-label">Nombre del Examen</label>
                           <input className="form-input" required 
                             value={examForm.nombre} onChange={e => setExamForm({...examForm, nombre: e.target.value})}
                           />
                        </div>
                        <div className="form-group">
                           <label className="form-label">Categoria</label>
                           <select className="form-select" required
                             value={examForm.id_categoria_examen} onChange={e => setExamForm({...examForm, id_categoria_examen: e.target.value})}
                           >
                              <option value="">Seleccionar...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                           </select>
                        </div>
                        <div className="form-group">
                           <label className="form-label">Precio</label>
                           <input type="number" step="0.01" className="form-input" required 
                             value={examForm.precio} onChange={e => setExamForm({...examForm, precio: e.target.value})}
                           />
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h4>Parametros / Resultados</h4>
                          <button type="button" className="btn btn-sm btn-outline" onClick={addDetailRow}>
                            <PlusIcon style={{ width: '14px', height: '14px' }} /> Agregar Parámetro
                          </button>
                        </div>
                        
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table style={{ fontSize: '0.9rem' }}>
                            <thead>
                              <tr>
                                <th>Nombre Parametro</th>
                                <th style={{ width: '100px' }}>Unidad</th>
                                <th style={{ width: '80px' }}>Min</th>
                                <th style={{ width: '80px' }}>Max</th>
                                <th style={{ width: '40px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {examForm.detalles.map((det, index) => (
                                <tr key={index}>
                                  <td style={{ padding: '0.25rem' }}>
                                    <input className="form-input" required placeholder="Ej: Hemoglobina"
                                      value={det.nombre} onChange={e => updateDetail(index, 'nombre', e.target.value)}
                                    />
                                  </td>
                                  <td style={{ padding: '0.25rem' }}>
                                    <input className="form-input" required placeholder="g/dL"
                                      value={det.unidad} onChange={e => updateDetail(index, 'unidad', e.target.value)}
                                    />
                                  </td>
                                  <td style={{ padding: '0.25rem' }}>
                                     <input className="form-input" type="number" step="0.1" placeholder="0" required
                                      value={det.valor_min} onChange={e => updateDetail(index, 'valor_min', e.target.value)}
                                    />
                                  </td>
                                  <td style={{ padding: '0.25rem' }}>
                                     <input className="form-input" type="number" step="0.1" placeholder="100" required
                                      value={det.valor_max} onChange={e => updateDetail(index, 'valor_max', e.target.value)}
                                    />
                                  </td>
                                  <td style={{ padding: '0.25rem' }}>
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeDetailRow(index)}>
                                      <XMarkIcon style={{ width: '14px', height: '14px' }} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  );
}
