import { db } from '@/storage/database/drizzle';
import { gameRecords } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

// 游戏记录类型定义
export interface GameRecord {
  id: number;
  userId: number;
  scenario: string;
  finalScore: number;
  result: string;
  playedAt: string;
}

// 创建游戏记录
export async function createGameRecord(record: {
  userId: number;
  scenario: string;
  finalScore: number;
  result: string;
}): Promise<GameRecord> {
  const result = await db
    .insert(gameRecords)
    .values({
      userId: record.userId,
      scenario: record.scenario,
      finalScore: record.finalScore,
      result: record.result,
    })
    .returning();

  return result[0];
}

// 获取用户的游戏记录
export async function getGameRecordsByUserId(userId: number, limit = 20): Promise<GameRecord[]> {
  const result = await db
    .select()
    .from(gameRecords)
    .where(eq(gameRecords.userId, userId))
    .orderBy(desc(gameRecords.playedAt))
    .limit(limit);

  return result;
}

// 获取用户游戏统计
export async function getUserGameStats(userId: number): Promise<{
  totalGames: number;
  wins: number;
  losses: number;
  avgScore: number;
  bestScore: number;
}> {
  const result = await db
    .select({
      finalScore: gameRecords.finalScore,
      result: gameRecords.result,
    })
    .from(gameRecords)
    .where(eq(gameRecords.userId, userId));

  if (result.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      avgScore: 0,
      bestScore: 0,
    };
  }

  const wins = result.filter(r => r.result === '通关').length;
  const totalScore = result.reduce((sum, r) => sum + r.finalScore, 0);

  return {
    totalGames: result.length,
    wins,
    losses: result.length - wins,
    avgScore: Math.round(totalScore / result.length),
    bestScore: Math.max(...result.map(r => r.finalScore)),
  };
}
