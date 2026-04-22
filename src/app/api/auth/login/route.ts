import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/user-service';
import { createToken, setAuthCookie } from '@/lib/auth';

// 强制使用Node.js运行时（bcrypt需要）
export const runtime = 'nodejs';

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // 验证输入
    if (!body.username || !body.password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证用户
    const user = await validateUser(body.username, body.password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 创建Token
    const token = await createToken({
      userId: user.id,
      username: user.username,
    });

    // 设置Cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user,
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}
