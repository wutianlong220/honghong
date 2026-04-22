import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SafeUser } from './user-service';

// JWT密钥（从环境变量获取或使用默认值）
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'honghong-simulator-secret-key-2024';
  return new TextEncoder().encode(secret);
};

// Token有效期：7天
const TOKEN_EXPIRY = '7d';

// 创建JWT Token
export async function createToken(payload: { userId: number; username: string }): Promise<string> {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey);
  
  return token;
}

// 验证JWT Token
export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

// 判断是否为生产环境
// 扣子编程环境下，无论是预览链接还是生产环境，访问都是通过 HTTPS
// 所以 Cookie 应该始终设置 Secure: true
const isProduction = () => {
  const env = process.env.COZE_PROJECT_ENV;
  // PROD 是生产环境，DEV 是开发环境（预览链接也是 HTTPS）
  return env === 'PROD' || env === 'DEV';
};

// 设置登录Cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction(), // 扣子编程环境下始终为 true（HTTPS）
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: '/',
  });
}

// 获取当前登录用户
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  // 动态导入避免循环依赖
  const { getUserById } = await import('./user-service');
  return getUserById(payload.userId);
}

// 清除登录Cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// 检查是否已登录
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
