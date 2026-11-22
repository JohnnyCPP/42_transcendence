'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/components/auth';
import { useRoles } from '@/lib/useRoles';
import { apiFetch } from '@/lib/apiClient';

type User = { id: string; username: string; email: string | null; displayName: string | null; role: string; status: string };
type Page = { users: User[]; pagination: { hasMore: boolean } };

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { canReadUsers, canManageUsers } = useRoles();
  const [users, setUsers] = useState<User[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    try {
      const page = await apiFetch<Page>(`/users?limit=50&offset=${offset}`);
      setUsers(page.users); setHasMore(page.pagination.hasMore); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios'); }
  }, [offset]);
  useEffect(() => {
    if (!isLoading && isAuthenticated && !canReadUsers) router.replace('/dashboard');
    if (!isLoading && canReadUsers) void load();
  }, [isLoading, isAuthenticated, canReadUsers, router, load]);
  async function update(id: string, changes: object) {
    try { await apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar'); }
  }
  async function remove(item: User) {
    if (!window.confirm(`¿Eliminar la cuenta ${item.username}?`)) return;
    try { await apiFetch(`/users/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar'); }
  }
  return <ProtectedRoute>{canReadUsers && <AppShell searchQuery={search} onSearchChange={setSearch}>
    <div className="overflow-auto p-8 space-y-5"><h1 className="text-2xl font-bold">Gestionar usuarios</h1>
      {error && <p role="alert" className="text-error">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{users.filter(item => item.username.toLowerCase().includes(search.toLowerCase())).map(item => <tr key={item.id} className="border-b border-outline-variant">
          <td className="py-3">{item.displayName || item.username}</td><td>{item.email || '—'}</td><td>{item.role}</td><td>{item.status}</td><td>
            {canManageUsers && <div className="flex gap-2">
              <button onClick={() => { const value = window.prompt('Nombre visible', item.displayName ?? ''); if (value?.trim()) void update(item.id, { displayName: value }); }}>Editar nombre</button>
              <button onClick={() => { const value = window.prompt('Correo electrónico', item.email ?? ''); if (value !== null) void update(item.id, { email: value.trim() || null }); }}>Editar correo</button>
              {item.id !== user?.id && <><button onClick={() => { const value = window.prompt('Rol: user, moderator o admin', item.role); if (value && ['user', 'moderator', 'admin'].includes(value)) void update(item.id, { role: value }); }}>Cambiar rol</button>
              <button onClick={() => void update(item.id, { status: item.status === 'active' ? 'disabled' : 'active' })}>{item.status === 'active' ? 'Desactivar' : 'Activar'}</button>
              <button onClick={() => void remove(item)}>Eliminar</button></>}
            </div>}
          </td></tr>)}</tbody></table></div>
      <div className="flex gap-4"><button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Anterior</button><button disabled={!hasMore} onClick={() => setOffset(offset + 50)}>Siguiente</button></div>
    </div></AppShell>}</ProtectedRoute>;
}
