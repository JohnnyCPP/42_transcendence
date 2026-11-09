'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AuthCard,
  Button,
  buttonClassName,
  TextInput,
  uiStyles,
} from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Introduce tu correo para continuar con la recuperación.');
      return;
    }

    setMessage('La recuperación ya tiene una pantalla dedicada. El siguiente paso será enlazar este flujo con el envío real de instrucciones.');
  };

  return (
    <AuthCard
      badgeIcon="lock_reset"
      badgeLabel="Acceso y recuperación"
      title="Recuperar contraseña"
      description="Indica tu correo para preparar el siguiente paso del flujo de recuperación desde la propia interfaz."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          id="forgot-email"
          name="email"
          type="email"
          value={email}
          placeholder="tu@empresa.com"
          onChange={setEmail}
        />

        {message && <div className={uiStyles.infoCallout}>{message}</div>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" variant="primary" size="lg">
            Continuar
          </Button>
          <Link href="/login" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
            Volver al login
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
