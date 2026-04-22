import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export interface Session {
  userId: number;
  username: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    username: payload.username,
  };
}
