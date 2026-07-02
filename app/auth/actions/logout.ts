'use server';

import { clearSessionCookies } from '@/core/auth/session';
import { redirect } from 'next/navigation';

export async function logout() {
  await clearSessionCookies();
  redirect('/');
}
