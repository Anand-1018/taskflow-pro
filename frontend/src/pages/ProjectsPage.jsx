import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const statusOptions = ['active', 'on-hold', 'completed'];

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'active', dueDate: '', members: [] });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchProjects(); if (isAdmin()) fetchUsers(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch {}
  };

  const openCreate = () => {
    setEditProject(null);
    setForm({ title: '', description: '', status: 'active', dueDate: '', members: [] });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({
      title: project.title,
      description: project.description || '',
      status: project.status,
      dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      members: project.members?.map(m => m._id) || [],
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editProject) {
        const { data } = await api.put(`/projects/${editProject._id}`, form);
        setProjects(projects.map(p => p._id === editProject._id ? data.data : p));
        toast.success('Project updated!');
      } else {
        const { data } = await api.post('/projects', form);
        setProjects([data.data, ...projects]);
        toast.success('Project created!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${deleteId}`);
      setProjects(projects.filter(p => p._id !== deleteId));
      toast.success('Project deleted');
      setDeleteId(null);
    } catch { toast.error('Delete failed'); }
  };

  const statusStyle = { active: 'bg-blue-100 text-blue-700', 'on-hold': 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <span>+</span> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-gray-700">No projects yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin() ? 'Create your first project to get started.' : 'No projects assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {project.title.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyle[project.status]}`}>
                  {project.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description provided.'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {project.dueDate ? `Due ${new Date(project.dueDate).toLocaleDateString()}` : 'No due date'}
                </div>
                {isAdmin() && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(project)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => setDeleteId(project._id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'Create Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
              value={form.title}
              onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
              placeholder="Project name"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief project description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Members</label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {users.map(u => (
                  <label key={u._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.members.includes(u._id)}
                      onChange={e => {
                        if (e.target.checked) setForm({ ...form, members: [...form.members, u._id] });
                        else setForm({ ...form, members: form.members.filter(id => id !== u._id) });
                      }}
                      className="accent-indigo-600"
                    />
                    <span>{u.name}</span>
                    <span className="text-gray-400 text-xs">({u.role})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Project">
        <p className="text-sm text-gray-600 mb-5">Are you sure? This will permanently delete the project and all its tasks.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleDelete} className="btn-danger text-sm">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
