import { useCallback, useState } from 'react';
import { changePassword } from '@/lib/securityApi';

/**
 * Estado y submit de cambio de contraseña (`POST /auth/password/change` vía stub).
 */
export function usePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (newPassword.length < 12) {
        setError('La nueva contraseña debe tener al menos 12 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      setIsLoading(true);
      try {
        await changePassword({ newPassword });
        setSuccess('Contraseña actualizada.');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo cambiar la contraseña'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [newPassword, confirmPassword]
  );

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    success,
    handleSubmit,
  };
}
