import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const priorities = ['low', 'medium', 'high'];
const statuses = ['pending', 'in-progress', 'completed'];

const priorityBadge = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const statusBadge = { pending: 'badge-pending', 'in-progress': 'badge-in-progress', completed: 'badge-completed' };

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', project: '', priority: 'medium', status: 'pending', dueDate: '', assignedTo: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
      if (isAdmin()) {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data.data);
      }
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', project: '', priority: 'medium', status: 'pending', dueDate: '', assignedTo: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title, description: task.description || '',
      project: task.project?._id || '', priority: task.priority,
      status: task.status, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDetail = async (task) => {
    setDetailTask(task);
    try {
      const { data } = await api.get(`/comments/${task._id}`);
      setComments(data.data);
    } catch { setComments([]); }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.project) errs.project = 'Project is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editTask) {
        const { data } = await api.put(`/tasks/${editTask._id}`, form);
        setTasks(tasks.map(t => t._id === editTask._id ? data.data : t));
        toast.success('Task updated!');
      } else {
        const { data } = await api.post('/tasks', form);
        setTasks([data.data, ...tasks]);
        toast.success('Task created!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? data.data : t));
      if (detailTask?._id === taskId) setDetailTask(data.data);
      toast.success('Status updated!');
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteId}`);
      setTasks(tasks.filter(t => t._id !== deleteId));
      toast.success('Task deleted');
      setDeleteId(null);
    } catch { toast.error('Delete failed'); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post('/comments', { text: newComment, taskId: detailTask._id });
      setComments([data.data, ...comments]);
      setNewComment('');
    } catch { toast.error('Failed to add comment'); }
  };

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <span>+</span> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select className="input-field w-auto text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All Priority</option>
          {priorities.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
          <p className="text-gray-400 text-sm mt-1">{isAdmin() ? 'Create your first task.' : 'No tasks assigned to you yet.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(task)} className="font-medium text-gray-900 hover:text-indigo-600 text-left truncate max-w-[180px] block">
                        {task.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">{task.project?.title || '—'}</td>
                    <td className="px-4 py-3"><span className={priorityBadge[task.priority]}>{task.priority}</span></td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task._id, e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer capitalize ${statusBadge[task.status]}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{task.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openDetail(task)} className="text-xs text-gray-500 hover:text-indigo-600">View</button>
                        {isAdmin() && <>
                          <button onClick={() => openEdit(task)} className="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
                          <button onClick={() => setDeleteId(task._id)} className="text-xs text-red-500 hover:text-red-700">Del</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className={`input-field ${errors.title ? 'border-red-400' : ''}`} value={form.title}
              onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
              placeholder="Task title" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field resize-none" rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select className={`input-field ${errors.project ? 'border-red-400' : ''}`} value={form.project}
              onChange={e => { setForm({ ...form, project: e.target.value }); setErrors({ ...errors, project: '' }); }}>
              <option value="">Select project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
            {errors.project && <p className="text-red-500 text-xs mt-1">{errors.project}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {priorities.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select className="input-field" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={!!detailTask} onClose={() => { setDetailTask(null); setComments([]); setNewComment(''); }} title="Task Details">
        {detailTask && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{detailTask.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{detailTask.description || 'No description.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Priority</p>
                <span className={priorityBadge[detailTask.priority]}>{detailTask.priority}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <select
                  value={detailTask.status}
                  onChange={e => handleStatusChange(detailTask._id, e.target.value)}
                  className="text-xs font-medium bg-transparent cursor-pointer capitalize"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Assigned To</p>
                <p className="text-xs font-medium text-gray-700">{detailTask.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Due Date</p>
                <p className="text-xs font-medium text-gray-700">
                  {detailTask.dueDate ? new Date(detailTask.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Comments ({comments.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No comments yet. Be the first!</p>
                ) : comments.map(c => (
                  <div key={c._id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {c.createdBy?.name?.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{c.createdBy?.name}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-field text-sm flex-1"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button onClick={handleAddComment} className="btn-primary text-sm px-3">Post</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Task">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this task? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleDelete} className="btn-danger text-sm">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
