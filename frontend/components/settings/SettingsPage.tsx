'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { uiStyles } from '@/components/ui';
import { PasswordSection } from './PasswordSection';
import { ReauthSection } from './ReauthSection';
import { TwoFactorSection } from './twoFactor';

/**
 * Ajustes de seguridad de la cuenta: reauth, password y 2FA.
 */
export function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ProtectedRoute>
      <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
        <div className={uiStyles.pageContent}>
          <section className="space-y-2">
            <p className={uiStyles.pageKicker}>Cuenta</p>
            <h1 className={uiStyles.pageTitle}>Ajustes de seguridad</h1>
            <p className={`max-w-2xl ${uiStyles.pageLead}`}>
              Reautentica tu sesión, cambia la contraseña y gestiona el segundo
              factor. Las llamadas a la API están preparadas en stubs para
              cablearlas tú.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReauthSection />
            <PasswordSection />
            <TwoFactorSection />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
