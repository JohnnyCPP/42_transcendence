/**
 * Muestra los códigos de recuperación tras confirm/regenerate,
 * o un placeholder si aún no hay ninguno.
 */
export function RecoveryCodes({
  recoveryCodes,
}: {
  recoveryCodes: string[];
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Códigos de recuperación
      </p>
      {recoveryCodes.length > 0 ? (
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-on-surface">
          {recoveryCodes.join('\n')}
        </pre>
      ) : (
        <p className="text-sm text-on-surface-variant">
          Se mostrarán una sola vez después de confirmar o regenerar.
        </p>
      )}
    </div>
  );
}
