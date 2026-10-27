import Link from 'next/link';

/**
 * Enlaces legales accesibles desde login, signup y documentos.
 *
 * Obligatorios para el subject de ft_transcendence (Privacy + Terms).
 */
export default function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav
      aria-label="Información legal"
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-on-surface-variant ${className}`}
    >
      <Link
        href="/privacy"
        className="font-medium transition-colors hover:text-primary"
      >
        Política de privacidad
      </Link>
      <span aria-hidden="true" className="text-outline-variant">
        ·
      </span>
      <Link
        href="/terms"
        className="font-medium transition-colors hover:text-primary"
      >
        Términos de servicio
      </Link>
    </nav>
  );
}
