'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/apiClient';
import RecoveryCodesDialog from '@/components/auth/RecoveryCodesDialog';

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
  const [remaining, setRemaining] = useState<number | null>(null);
  const [action, setAction] = useState<'regenerate' | 'disable' | null>(null);
  const [method, setMethod] = useState<'totp' | 'recovery_code'>('totp');

  useEffect(() => {
    let active = true;
    apiFetch<Status>('/auth/2fa/status').then(async value => {
      if (active) setStatus(value);
      if (value.enabled) {
        const result = await apiFetch<{ remaining: number }>('/auth/2fa/recovery-codes/remaining');
        if (active) setRemaining(result.remaining);
      }
    })
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
      setSetup(null); setCode(''); setCodes(result.recoveryCodes); setStatus({ enabled: true }); setRemaining(10);
    } catch (err) { setError(err instanceof ApiError && err.status === 400 ? 'El código no es válido o la configuración ya ha cambiado. Comprueba el código e inténtalo de nuevo.' : 'No se ha podido confirmar el código.'); }
    finally { setBusy(false); }
  }

  async function reauthenticateForAction(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (action === 'disable') {
        await apiFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password, code, method }) });
        setStatus({ enabled: false }); setRemaining(0); setAction(null);
      } else {
        await apiFetch('/auth/reauthenticate', { method: 'POST', body: JSON.stringify({ password, secondFactorCode: code, secondFactorMethod: method }) });
        const result = await apiFetch<{ recoveryCodes: string[] }>('/auth/2fa/recovery-codes/regenerate', { method: 'POST' });
        setCodes(result.recoveryCodes); setRemaining(10); setAction(null);
      }
      setPassword(''); setCode('');
    } catch (err) { setError(err instanceof ApiError && err.status === 401 ? 'La contraseña o el código no son válidos. Compruébalos e inténtalo de nuevo.' : err instanceof ApiError && err.status === 429 ? 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' : 'No se ha podido completar la operación.'); }
    finally { setBusy(false); }
  }

  function cancelAction() {
    setAction(null); setPassword(''); setCode(''); setError('');
  }

  return <main className="mx-auto max-w-xl space-y-6 p-6">
    <Link href="/dashboard" className="text-primary hover:underline">← Volver al inicio</Link>
    <h1 className="text-2xl font-semibold">Seguridad de la cuenta</h1>
    <h2 className="text-lg font-semibold">Autenticación en dos pasos</h2>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!status && !error && <p>Consultando estado…</p>}
    {status?.enabled && !codes && <section className="space-y-4">
      <p>La autenticación en dos pasos está activada.</p>
      <p>Códigos de recuperación disponibles: {remaining ?? '…'}</p>
      {remaining === 1 && <div role="status" className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">Solo te queda un código de recuperación.</p>
        <p>Genera nuevos códigos antes de necesitar el último. Puedes usarlo para confirmar la regeneración.</p>
      </div>}
      {remaining === 0 && <div role="status" className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">No te quedan códigos de recuperación.</p>
        <p>Si tienes acceso a tu aplicación de autenticación, úsala para generar nuevos códigos.</p>
      </div>}
      {!action && <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded border px-4 py-2" onClick={() => setAction('regenerate')}>Regenerar códigos</button>
        <button type="button" className="rounded border px-4 py-2" onClick={() => setAction('disable')}>Desactivar 2FA</button>
      </div>}
      {action && <form onSubmit={reauthenticateForAction} className="space-y-4">
        <h3 className="font-semibold">{action === 'disable' ? 'Desactivar 2FA' : 'Regenerar códigos de recuperación'}</h3>
          <p>Confirma tu contraseña y un código de autenticación para continuar.</p>
          <label className="block">Contraseña
            <input className="block w-full rounded border p-2" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        <label className="block">Método
          <select className="block w-full rounded border p-2" value={method} onChange={e => { setMethod(e.target.value as 'totp' | 'recovery_code'); setCode(''); }}>
            <option value="totp">Aplicación de autenticación</option>
            <option value="recovery_code">Código de recuperación</option>
          </select>
        </label>
        <label className="block">{method === 'totp' ? 'Código de 6 dígitos' : 'Código de recuperación'}
          <input className="block w-full rounded border p-2" autoComplete="one-time-code" inputMode={method === 'totp' ? 'numeric' : 'text'} pattern={method === 'totp' ? '[0-9]{6}' : '[A-Za-z0-9_-]{12}'} required value={code} onChange={e => setCode(e.target.value)} />
        </label>
        <div className="flex gap-3">
          <button className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50" disabled={busy}>{action === 'disable' ? 'Confirmar desactivación' : 'Continuar'}</button>
          <button type="button" className="rounded border px-4 py-2" disabled={busy} onClick={cancelAction}>Cancelar</button>
        </div>
      </form>}
    </section>}
    {status && !status.enabled && !setup && <form onSubmit={begin} className="space-y-4">
      <p>La autenticación en dos pasos está desactivada.</p>
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
    {codes && <RecoveryCodesDialog codes={codes} onSaved={() => setCodes(null)} />}
  </main>;
}

export default function SecurityPage() {
  return <ProtectedRoute><SecuritySettings /></ProtectedRoute>;
}
