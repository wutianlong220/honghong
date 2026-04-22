import { NextRequest, NextResponse } from 'next/server';
import { createGameRecord } from '@/lib/game-record-service';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scenario, finalScore, result } = body;

    if (!scenario || finalScore === undefined || !result) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const record = await createGameRecord({
      userId: session.userId,
      scenario,
      finalScore,
      result,
    });

    return NextResponse.json({
      success: true,
      message: '游戏记录保存成功',
      record,
    });
  } catch (error) {
    console.error('保存游戏记录失败:', error);
    return NextResponse.json(
      { success: false, error: '保存游戏记录失败' },
      { status: 500 }
    );
  }
}
