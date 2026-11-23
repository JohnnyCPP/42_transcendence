import { redirect } from 'next/navigation';

/**
 * `/security` era la página legacy de 2FA.
 * La entrada oficial es `/settings`; redirigimos bookmarks antiguos.
 */
export default function SecurityRedirect() {
  redirect('/settings');
}
