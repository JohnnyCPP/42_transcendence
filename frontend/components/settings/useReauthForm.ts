import { useCallback, useState } from 'react';
import {
  reauthenticate,
  type SecondFactorMethod,
} from '@/lib/securityApi';

/**
 * Estado y submit de reautenticación (`POST /auth/reauthenticate` vía stub).
 */
export function useReauthForm(onSuccess?: () => void) {
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<SecondFactorMethod | ''>('');
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!password.trim()) {
        setError('Introduce tu contraseña actual');
        return;
      }

      if (method && !secondFactorCode.trim()) {
        setError('Introduce el código del segundo factor');
        return;
      }

      setIsLoading(true);
      try {
        await reauthenticate({
          password: password.trim(),
          ...(method
            ? {
                secondFactorMethod: method,
                secondFactorCode: secondFactorCode.trim(),
              }
            : {}),
        });
        setSuccess('Identidad confirmada. Puedes realizar acciones sensibles.');
        setPassword('');
        setSecondFactorCode('');
        onSuccess?.();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo reautenticar'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [password, method, secondFactorCode, onSuccess]
  );

  return {
    password,
    setPassword,
    method,
    setMethod,
    secondFactorCode,
    setSecondFactorCode,
    isLoading,
    error,
    success,
    handleSubmit,
  };
}
