'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { codes: string[]; onSaved: () => void };

export default function RecoveryCodesDialog({ codes, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previouslyFocused?.focus();
    };
  }, []);

  async function copyCodes() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(codes.join('\n'));
      setMessage('Códigos copiados. Guárdalos en un lugar seguro.');
    } catch {
      setMessage('No se han podido copiar. Selecciona y copia los códigos manualmente.');
    }
  }

  return <dialog
    ref={dialogRef}
    aria-labelledby="recovery-codes-title"
    aria-describedby="recovery-codes-description"
    onCancel={event => event.preventDefault()}
    className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-outline-variant bg-white p-6 shadow-2xl backdrop:bg-black/50"
  >
    <h2 id="recovery-codes-title" className="text-xl font-semibold">Guarda tus códigos de recuperación</h2>
    <p id="recovery-codes-description" className="mt-3">Guárdalos ahora en un lugar seguro. No volverán a mostrarse.</p>
    <ul className="my-5 grid grid-cols-2 gap-2" aria-label="Códigos de recuperación">
      {codes.map(code => <li key={code}><code className="select-all">{code}</code></li>)}
    </ul>
    <p role="status" className="min-h-6 text-sm">{message}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="rounded border px-4 py-2" onClick={copyCodes}>Copiar códigos</button>
      <button type="button" className="rounded bg-primary px-4 py-2 text-white" onClick={onSaved} autoFocus>Ya los he guardado</button>
    </div>
  </dialog>;
}
