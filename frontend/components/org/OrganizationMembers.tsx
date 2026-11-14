'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useOrg } from './useOrg';

type Member = { userId: string; role: 'owner' | 'admin' | 'member'; user: { username: string; displayName: string | null } | null };

export function OrganizationMembers() {
  const { activeOrganization } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const id = activeOrganization?.id;
  const role = activeOrganization?.role;
  const load = useCallback(async () => {
    if (!id) { setMembers([]); return; }
    try { const result = await apiFetch<{ members: Member[] }>(`/organizations/${id}/members`); setMembers(result.members); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los miembros'); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function change(member: Member, method: 'PUT' | 'DELETE') {
    if (!id) return;
    if (method === 'DELETE' && !window.confirm(`¿Retirar a ${member.user?.username ?? 'este miembro'}?`)) return;
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      await apiFetch(`/organizations/${id}/members/${member.userId}`, { method, ...(method === 'PUT' ? { body: JSON.stringify({ role: nextRole }) } : {}) });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo modificar el miembro'); }
  }
  if (!id) return null;
  return <section className="mt-6 rounded-xl border border-outline-variant p-5 space-y-3">
    <h2 className="text-lg font-semibold">Miembros de {activeOrganization.name}</h2>
    {error && <p role="alert" className="text-error">{error}</p>}
    {members.map(member => <div key={member.userId} className="flex flex-wrap items-center gap-3 border-b border-outline-variant py-2">
      <span className="flex-1">{member.user?.displayName || member.user?.username || 'Usuario'}</span><span>{member.role}</span>
      {role === 'owner' && member.role !== 'owner' && <button onClick={() => void change(member, 'PUT')}>Cambiar rol</button>}
      {member.role !== 'owner' && (role === 'owner' || (role === 'admin' && member.role === 'member')) && <button onClick={() => void change(member, 'DELETE')}>Retirar</button>}
    </div>)}
  </section>;
}
