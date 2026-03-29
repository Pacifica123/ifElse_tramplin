export type UserRole = 'applicant' | 'employer' | 'curator' | 'admin_curator';

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}
