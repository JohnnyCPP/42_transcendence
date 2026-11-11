import { LoginCredentials } from '../auth.types';
import type { TwoFactorMethod } from './TwoFactorForm';

export type LoginStep = 'credentials' | 'two_factor';

export interface LoginFormCardProps {
  isLoading: boolean;
  error: string | null;
  step: LoginStep;
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onTwoFactorSubmit: (code: string, method: TwoFactorMethod) => Promise<void>;
  onBackFromTwoFactor: () => void;
}

export interface LoginPageViewProps {
  isLoading: boolean;
  error: string | null;
  step: LoginStep;
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onTwoFactorSubmit: (code: string, method: TwoFactorMethod) => Promise<void>;
  onBackFromTwoFactor: () => void;
}
