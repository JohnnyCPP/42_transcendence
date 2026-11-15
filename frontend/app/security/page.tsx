'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { apiFetch } from '@/lib/apiClient';

type Status = { enabled: boolean; confirmedAt?: string };
type Setup = { otpauthUri: string; manualEntryKey: string };

function SecuritySettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<Status>('/auth/2fa/status').then(value => { if (active) setStatus(value); })
      .catch(() => { if (active) setError('No se ha podido consultar el estado de seguridad.'); });
    return () => { active = false; };
  }, []);

  async function begin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await apiFetch('/auth/reauthenticate', { method: 'POST', body: JSON.stringify({ password }) });
      setPassword('');
      setSetup(await apiFetch<Setup>('/auth/2fa/setup', { method: 'POST' }));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se ha podido iniciar la configuración.'); }
    finally { setBusy(false); }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await apiFetch<{ recoveryCodes: string[] }>('/auth/2fa/verify-setup', { method: 'POST', body: JSON.stringify({ code }) });
      setSetup(null); setCode(''); setCodes(result.recoveryCodes); setStatus({ enabled: true });
    } catch (err) { setError(err instanceof Error ? err.message : 'No se ha podido confirmar el código.'); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-xl space-y-6 p-6">
    <Link href="/dashboard" className="text-primary hover:underline">← Volver al inicio</Link>
    <h1 className="text-2xl font-semibold">Seguridad de la cuenta</h1>
    <h2 className="text-lg font-semibold">Autenticación en dos pasos</h2>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!status && !error && <p>Consultando estado…</p>}
    {status?.enabled && !codes && <p>La autenticación en dos pasos está activada.</p>}
    {status && !status.enabled && !setup && <form onSubmit={begin} className="space-y-4">
      <p>Confirma tu contraseña para configurar una aplicación de autenticación.</p>
      <label className="block">Contraseña
        <input className="block w-full rounded border p-2" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <button className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50" disabled={busy}>Configurar 2FA</button>
    </form>}
    {setup && <form onSubmit={confirm} className="space-y-4">
      <p>Escanea este código con tu aplicación de autenticación o introduce la clave manualmente.</p>
      <div className="inline-block bg-white p-3"><QRCodeSVG value={setup.otpauthUri} size={200} title="Código QR para configurar 2FA" /></div>
      <p>Clave manual: <code className="break-all select-all">{setup.manualEntryKey}</code></p>
      <label className="block">Código de 6 dígitos
        <input className="block w-full rounded border p-2" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} />
      </label>
      <button className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50" disabled={busy}>Activar 2FA</button>
    </form>}
    {codes && <section className="space-y-3" aria-live="polite">
      <h2 className="font-semibold">Guarda tus códigos de recuperación</h2>
      <p>Se muestran una sola vez. Guárdalos en un lugar seguro para recuperar el acceso.</p>
      <ul className="grid grid-cols-2 gap-2">{codes.map(item => <li key={item}><code>{item}</code></li>)}</ul>
      <button type="button" onClick={() => setCodes(null)} className="rounded border px-4 py-2">Ya los he guardado</button>
    </section>}
  </main>;
}

export default function SecurityPage() {
  return <ProtectedRoute><SecuritySettings /></ProtectedRoute>;
}
