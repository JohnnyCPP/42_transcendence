import Link from 'next/link';
import { NavItemProps } from './sidebar.types';

/**
 * Enlace de navegación del sidebar.
 */
export function NavItem({
  href,
  icon,
  label,
  active,
  onClick,
  fill,
}: NavItemProps) {
  const baseClassName = `flex items-center gap-3 px-4 py-2 rounded-r-md font-medium text-[14px] transition-colors duration-200 ${
    active
      ? 'bg-primary/10 text-primary border-l-4 border-primary'
      : 'text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent hover:text-on-surface'
  }`;

  const content = (
    <>
      <span
        className="material-symbols-outlined text-[20px]"
        style={{
          fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

  return href.startsWith('/') ? (
    <Link href={href} onClick={onClick} className={baseClassName}>
      {content}
    </Link>
  ) : (
    <a href={href} onClick={onClick} className={baseClassName}>
      {content}
    </a>
  );
}
