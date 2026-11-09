/**
 * Props compartidas entre `SignupPageView` y `SignupPageForm`.
 *
 * Este contrato define:
 * - estado controlado de inputs
 * - mensajes de feedback
 * - handler de envío
 */
export interface SignupPageFormProps {
  /** Nombre de usuario en edición. */
  username: string;
  setUsername: (value: string) => void;

  /** Email opcional del usuario. */
  email: string;
  setEmail: (value: string) => void;

  /** Contraseña en edición. */
  password: string;
  setPassword: (value: string) => void;

  /** Mensaje local de validación o éxito del formulario. */
  formMessage: string | null;
  
  /** Error de autenticación expuesto por `useAuth`. */
  error: string | null;
  
  /** Estado de carga durante envío. */
  isLoading: boolean;
  
  /** Handler principal de submit del formulario. */
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}