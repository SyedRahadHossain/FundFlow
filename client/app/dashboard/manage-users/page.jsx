'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';

const ROLES = ['supporter', 'creator', 'admin'];
const ROLE_STYLE = {
  supporter: 'bg-info-light text-info-dark',
  creator:   'bg-accent-light text-accent',
  admin:     'bg-error-light text-error-hover',
};

export default function ManageUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [removing, setRemoving] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/api/users')
      .then(res => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id, email) => {
    if (!window.confirm(`Remove user ${email}? This cannot be undone.`)) return;
    setRemoving(id);
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User removed');
      setUsers(us => us.filter(u => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Remove failed');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (id, role) => {
    setUpdating(id);
    try {
      await api.patch(`/api/users/${id}/role`, { role });
      toast.success(`Role updated to ${role}`);
      setUsers(us => us.map(u => u._id === id ? { ...u, role } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(u =>
    !search.trim() ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Manage Users</h2>
          <p className="text-neutral-500 text-sm mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Input
          type="text"
          aria-label="Search users by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full sm:w-64"
        />
      </div>

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <span className="text-5xl block mb-3">👥</span>
            <p>{search ? 'No users match your search.' : 'No users yet.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-right">Credits</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(u => (
                    <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.photo
                            ? <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-accent font-bold text-sm uppercase">{u.name?.[0]}</div>}
                          <span className="font-medium text-neutral-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 text-xs">{u.email}</td>
                      <td className="px-5 py-3.5 text-right text-accent font-semibold">💎 {(u.credits || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          disabled={updating === u._id || u.email === me?.email}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 focus:outline-none focus:ring-3 focus:ring-primary disabled:opacity-50 ${ROLE_STYLE[u.role]}`}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleRemove(u._id, u.email)}
                          disabled={removing === u._id || u.email === me?.email}
                          className="text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 font-medium"
                        >
                          {removing === u._id ? '…' : '🗑️ Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-neutral-50">
              {filtered.map(u => (
                <div key={u._id} className="px-4 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    {u.photo
                      ? <img src={u.photo} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-accent font-bold uppercase">{u.name?.[0]}</div>}
                    <div>
                      <p className="font-medium text-neutral-800">{u.name}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                      disabled={updating === u._id || u.email === me?.email}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50 ${ROLE_STYLE[u.role]}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => handleRemove(u._id, u.email)}
                      disabled={removing === u._id || u.email === me?.email}
                      className="text-xs bg-error-light border border-error/20 text-error-hover px-3 py-1.5 rounded-lg disabled:opacity-40">
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
