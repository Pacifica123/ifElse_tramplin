import type { DemoAccount, SessionUser } from '@/shared/types/common';

export const demoAccounts: DemoAccount[] = [
  {
    email: 'student@example.com',
    password: 'test12345',
    name: 'Анна Студент',
    role: 'applicant',
    description: 'Соискатель',
  },
  {
    email: 'hr@example.com',
    password: 'test12345',
    name: 'ООО ТехНова',
    role: 'employer',
    description: 'Работодатель',
  },
  {
    email: 'curator@example.com',
    password: 'test12345',
    name: 'Куратор платформы',
    role: 'curator',
    description: 'Куратор',
  },
  {
    email: 'admin@example.com',
    password: 'test12345',
    name: 'Главный куратор',
    role: 'admin_curator',
    description: 'Админ-куратор',
  },
];

export function authorizeDemoUser(email: string, password: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const account = demoAccounts.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === normalizedPassword,
  );

  if (!account) {
    return null;
  }

  return {
    id: Date.now(),
    displayName: account.name,
    email: account.email,
    role: account.role,
  };
}
