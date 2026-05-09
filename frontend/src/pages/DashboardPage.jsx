import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, sub }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// Simple bar chart using CSS
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-3 h-32 mt-4">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{item.count}</span>
          <div
            className={`w-full rounded-t-md transition-all duration-500 ${item.color}`}
            style={{ height: `${(item.count / max) * 100}%`, minHeight: item.count > 0 ? '8px' : '0' }}
          />
          <span className="text-xs text-gray-500 text-center leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, projectsRes, statsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/tasks/stats'),
      ]);

      const tasks = tasksRes.data.data;
      const projs = projectsRes.data.data;
      const taskStats = statsRes.data.data;

      const statusMap = {};
      (taskStats.statusStats || []).forEach(s => { statusMap[s._id] = s.count; });

      setStats({
        totalProjects: projs.length,
        totalTasks: tasks.length,
        completed: statusMap['completed'] || 0,
        pending: statusMap['pending'] || 0,
        inProgress: statusMap['in-progress'] || 0,
      });

      setRecentTasks(tasks.slice(0, 5));
      setProjects(projs.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats ? [
    { label: 'Pending', count: stats.pending, color: 'bg-gray-400' },
    { label: 'In Progress', count: stats.inProgress, color: 'bg-blue-400' },
    { label: 'Completed', count: stats.completed, color: 'bg-green-400' },
  ] : [];

  const priorityColors = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
  const statusColors = { pending: 'badge-pending', 'in-progress': 'badge-in-progress', completed: 'badge-completed' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Projects" value={stats?.totalProjects} icon="📁" color="bg-indigo-50" />
            <StatCard title="Total Tasks" value={stats?.totalTasks} icon="📋" color="bg-blue-50" />
            <StatCard title="Completed" value={stats?.completed} icon="✅" color="bg-green-50" />
            <StatCard title="In Progress" value={stats?.inProgress} icon="⏳" color="bg-yellow-50" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900">Task Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">Status distribution</p>
          {loading ? (
            <div className="h-32 mt-4 animate-pulse bg-gray-100 rounded-lg" />
          ) : stats?.totalTasks === 0 ? (
            <div className="h-32 mt-4 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl">📊</span>
              <p className="text-sm mt-2">No tasks yet</p>
            </div>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>

        {/* Recent Projects */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Projects</h2>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <span className="text-4xl">📁</span>
              <p className="text-sm mt-2 text-gray-400">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      {p.title.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.members?.length || 0} members</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    p.status === 'completed' ? 'bg-green-100 text-green-700' :
                    p.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            <span className="text-5xl">✅</span>
            <p className="text-sm mt-3 text-gray-400">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Task</th>
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Project</th>
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Priority</th>
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTasks.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 truncate max-w-[200px]">{task.title}</td>
                    <td className="py-3 text-gray-500">{task.project?.title || '—'}</td>
                    <td className="py-3"><span className={priorityColors[task.priority]}>{task.priority}</span></td>
                    <td className="py-3"><span className={statusColors[task.status]}>{task.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
