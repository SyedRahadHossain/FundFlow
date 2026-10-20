'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';

const ROLES = ['supporter', 'creator', 'admin'];
const ROLE_STYLE = {
  supporter: 'bg-info-light text-info-dark hover:bg-info/20',
  creator:   'bg-accent-light text-accent hover:bg-accent/20',
  admin:     'bg-error-light text-error-hover hover:bg-error/20',
};

export default function ManageUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [removing, setRemoving] = useState(null);
  const [confirming, setConfirming] = useState(null); // { id, email } pending removal
  const [updating, setUpdating] = useState(null);
  const [error, setError]       = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/users');
        setUsers(res.data || []);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const handleRemove = async (id) => {
    setRemoving(id);
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User removed');
      setUsers(us => us.filter(u => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove the user. Please try again.');
    } finally {
      setRemoving(null);
      setConfirming(null);
    }
  };

  const handleRoleChange = async (id, role) => {
    setUpdating(id);
    try {
      await api.patch(`/api/users/${id}/role`, { role });
      toast.success(`Role updated to ${role.charAt(0).toUpperCase()}${role.slice(1)}`);
      setUsers(us => us.map(u => u._id === id ? { ...u, role } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update the role. Please try again.');
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
          {!error && (
            <p className="text-neutral-500 text-sm mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
          )}
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

      {error && (
        <ErrorBanner message="We couldn’t load users." onRetry={retry} />
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="users"
              role="admin"
              subtitle={search ? 'No users match your search.' : 'Registered users will appear here.'}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-[13px] uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">User</th>
                      <th className="px-5 py-3 text-left">Email</th>
                      <th className="px-5 py-3 text-right">Credits</th>
                      <th className="px-5 py-3 text-left">Role</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filtered.map(u => (
                      <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.photo} name={u.name} size="sm" />
                            <span className="font-medium text-neutral-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 text-[13px]">{u.email}</td>
                        <td className="px-5 py-3.5 text-right text-accent font-semibold tabular-nums">
                          <span className="inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{(u.credits || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            disabled={updating === u._id || u.email === me?.email}
                            aria-label={`Role for ${u.name}`}
                            className={`text-[13px] font-semibold px-2.5 py-1.5 min-h-9 rounded-lg border-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${ROLE_STYLE[u.role]}`}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Icon name="delete" />}
                            onClick={() => setConfirming({ id: u._id, email: u.email })}
                            disabled={removing === u._id || u.email === me?.email}
                            className="bg-error-light! border border-error/20 text-error-hover! hover:bg-error/20!"
                          >
                            {removing === u._id ? 'Removing…' : 'Remove'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-neutral-200">
                {filtered.map(u => (
                  <div key={u._id} className="px-4 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar src={u.photo} name={u.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-800">{u.name}</p>
                        <p className="text-[13px] text-neutral-500 break-all">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                        disabled={updating === u._id || u.email === me?.email}
                        aria-label={`Role for ${u.name}`}
                        className={`text-[13px] font-semibold px-3 py-2 min-h-11 rounded-lg border-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${ROLE_STYLE[u.role]}`}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Icon name="delete" />}
                        onClick={() => setConfirming({ id: u._id, email: u.email })}
                        disabled={removing === u._id || u.email === me?.email}
                        className="bg-error-light! border border-error/20 text-error-hover! hover:bg-error/20!"
                      >
                        {removing === u._id ? 'Removing…' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => handleRemove(confirming.id, confirming.email)}
        title="Remove user?"
        description={`This permanently removes ${confirming?.email}'s account and all their data. This cannot be undone.`}
        confirmText="Remove user"
        cancelText="Cancel"
        loading={removing === confirming?.id}
      />
    </div>
  );
}
