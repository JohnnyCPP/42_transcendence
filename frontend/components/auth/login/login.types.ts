import { LoginCredentials } from '../auth.types';

export interface LoginFormCardProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
}

export interface LoginPageViewProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
}
