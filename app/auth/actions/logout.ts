'use server';

import { clearSessionCookies } from '@/app/auth/actions/session';
import { redirect } from 'next/navigation';

export async function logout() {
  await clearSessionCookies();
  redirect('/');
}
