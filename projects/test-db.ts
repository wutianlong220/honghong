import { db } from './src/storage/database/drizzle';
import { users, gameRecords } from './src/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

async function testDatabase() {
  console.log('=== 数据库连接测试 ===\n');

  try {
    // 测试数据库连接
    console.log('1. 测试数据库连接...');
    const health = await db.select().from(users).limit(1);
    console.log('✅ 数据库连接成功');
    console.log('当前用户数量:', health.length);

    // 查看所有用户
    console.log('\n2. 所有用户:');
    const allUsers = await db.select().from(users);
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 注册时间: ${user.createdAt}`);
    });

    // 查看所有游戏记录
    console.log('\n3. 所有游戏记录:');
    const allRecords = await db
      .select()
      .from(gameRecords)
      .orderBy(desc(gameRecords.playedAt));

    if (allRecords.length === 0) {
      console.log('🚫 暂无游戏记录');
    } else {
      allRecords.forEach(record => {
        console.log(`ID: ${record.id}, 用户ID: ${record.userId}, 场景: ${record.scenario}, 分数: ${record.finalScore}, 结果: ${record.result}, 时间: ${record.playedAt}`);
      });
    }

    // 测试排行榜查询
    console.log('\n4. 排行榜数据查询:');
    const leaderboardData = await db
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

    console.log('排行榜原始数据数量:', leaderboardData.length);

    // 去重：每个用户只保留最高分
    const userBestScores = new Map();
    for (const record of leaderboardData) {
      if (!userBestScores.has(record.userId)) {
        userBestScores.set(record.userId, record);
      }
    }

    console.log('去重后数据数量:', userBestScores.size);

    const topRecords = Array.from(userBestScores.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 20);

    console.log('最终排行榜前20名数量:', topRecords.length);
    topRecords.forEach((record, index) => {
      console.log(`${index + 1}. 用户: ${record.username}, 分数: ${record.finalScore}`);
    });

  } catch (error) {
    console.error('❌ 数据库操作失败:', error);
  }
}

testDatabase().then(() => {
  console.log('\n=== 测试完成 ===');
  process.exit(0);
}).catch(error => {
  console.error('❌ 程序出错:', error);
  process.exit(1);
});
