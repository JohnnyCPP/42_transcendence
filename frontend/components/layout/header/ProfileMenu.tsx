'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';

/**
 * Props del bocadillo de perfil (capa presentacional).
 */
interface ProfileMenuContentProps {
  displayName: string;
  username?: string;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

/**
 * Contenido del menú emergente del avatar.
 *
 * Solo presenta datos y la acción de cerrar sesión;
 * el estado lo controla `ProfileMenu`.
 */
function ProfileMenuContent({
  displayName,
  username,
  handleLogout,
  isLoggingOut,
}: ProfileMenuContentProps) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-lg"
    >
      <div className="border-b border-outline-variant px-4 py-3">
        <p className="truncate text-sm font-semibold text-on-surface">
          {displayName}
        </p>
        {username && (
          <p className="mt-0.5 truncate text-xs text-on-surface-variant">
            @{username}
          </p>
        )}
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  );
}

/**
 * Avatar de perfil con menú tipo bocadillo.
 *
 * Lee la sesión compartida (`useAuth`), muestra el usuario activo
 * y permite cerrar sesión redirigiendo al login.
 */
export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name || user?.username || 'Usuario';
  const username = user?.username;
  const initial = displayName.charAt(0).toUpperCase();

  // Cierra el menú si el clic ocurre fuera del avatar/bocadillo.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  /**
   * Invalida la sesión en backend y vuelve a la pantalla de login.
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
      router.push('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary/10 text-sm font-semibold text-primary cursor-pointer hover:border-primary transition-colors"
        aria-label="Menú de perfil"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={`Perfil de ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </button>

      {isOpen && (
        <ProfileMenuContent
          displayName={displayName}
          username={username}
          handleLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      )}
    </div>
  );
}
