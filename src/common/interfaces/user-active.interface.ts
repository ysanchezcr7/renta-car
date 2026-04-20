/** Payload JWT unificado: operadores User (SUPER_ADMIN, CUSTOMER) o cuenta Agencia. */
export interface UserActiveInterface {
  email: string;
  role: string;
  /** PK de `User`; null si la sesión es cuenta de agencia (`authSubject === 'agency'`). */
  id: number | null;
  agencyId?: number | null;
  isVerified?: boolean;
  authSubject?: 'user' | 'agency';
}
