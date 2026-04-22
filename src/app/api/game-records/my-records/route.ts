import { NextRequest, NextResponse } from 'next/server';
import { getGameRecordsByUserId, getUserGameStats } from '@/lib/game-record-service';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const [records, stats] = await Promise.all([
      getGameRecordsByUserId(session.userId),
      getUserGameStats(session.userId),
    ]);

    return NextResponse.json({
      success: true,
      records,
      stats,
    });
  } catch (error) {
    console.error('获取游戏记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取游戏记录失败' },
      { status: 500 }
    );
  }
}
