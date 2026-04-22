import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/drizzle';
import { gameRecords, users } from '@/storage/database/shared/schema';
import { desc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    // 获取所有游戏记录，连同用户名一起获取
    const records = await db
      .select({
        id: gameRecords.id,
        userId: gameRecords.userId,
        username: users.username,
        scenario: gameRecords.scenario,
        finalScore: gameRecords.finalScore,
        result: gameRecords.result,
        playedAt: gameRecords.playedAt,
      })
      .from(gameRecords)
      .innerJoin(users, eq(gameRecords.userId, users.id))
      .orderBy(desc(gameRecords.finalScore))
      .limit(100);

    // 去重：每个用户只保留最高分
    const userBestScores = new Map();
    for (const record of records) {
      if (!userBestScores.has(record.userId)) {
        userBestScores.set(record.userId, record);
      }
    }

    // 转换为数组并排序，取前20名
    const topRecords = Array.from(userBestScores.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 20);

    // 构建排行榜数据
    const leaderboard = topRecords.map((record, index) => ({
      rank: index + 1,
      userId: record.userId,
      username: record.username,
      scenario: record.scenario,
      score: record.finalScore,
      playedAt: record.playedAt,
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json(
      { success: false, error: '获取排行榜失败' },
      { status: 500 }
    );
  }
}
