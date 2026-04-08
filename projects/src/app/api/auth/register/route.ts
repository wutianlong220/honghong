import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/user-service';
import { createToken, setAuthCookie } from '@/lib/auth';

// 强制使用Node.js运行时（bcrypt需要）
export const runtime = 'nodejs';

interface RegisterRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();

    // 验证输入
    if (!body.username || !body.password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (body.username.length < 3 || body.username.length > 20) {
      return NextResponse.json(
        { success: false, error: '用户名长度必须在3-20个字符之间' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await createUser(body.username, body.password);

    // 创建Token
    const token = await createToken({
      userId: user.id,
      username: user.username,
    });

    // 设置Cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user,
    });
  } catch (error) {
    console.error('注册失败:', error);
    const errorMessage = error instanceof Error ? error.message : '注册失败';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorMessage === '用户名已存在' ? 409 : 500 }
    );
  }
}
