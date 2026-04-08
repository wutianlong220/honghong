import { db } from '@/storage/database/drizzle';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// 用户类型定义
export interface User {
  id: number;
  username: string;
  password: string;
  createdAt: string;
}

// 安全用户类型（不包含密码）
export type SafeUser = Omit<User, 'password'>;

// 根据用户名查找用户
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  return {
    id: user.id,
    username: user.username,
    password: user.password,
    createdAt: user.createdAt,
  };
}

// 根据ID查找用户
export async function getUserById(id: number): Promise<SafeUser | null> {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

// 创建用户（注册）
export async function createUser(username: string, password: string): Promise<SafeUser> {
  // 检查用户名是否已存在
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('用户名已存在');
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await db
    .insert(users)
    .values({
      username,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    });

  return result[0];
}

// 验证密码
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// 用户登录验证
export async function validateUser(username: string, password: string): Promise<SafeUser | null> {
  const user = await getUserByUsername(username);
  
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return null;
  }

  // 返回不包含密码的用户信息
  const { password: _, ...safeUser } = user;
  return safeUser;
}
