import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './src/storage/database/shared/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(pool);

async function test() {
  try {
    console.log('=== 测试 Drizzle ORM 注册 ===\n');

    const testUsername = 'testdrizzle_' + Date.now();

    // 1. 创建用户
    console.log('1. 创建用户...');
    const result = await db
      .insert(users)
      .values({
        username: testUsername,
        password: '$2b$10$test',
      })
      .returning({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      });

    console.log('结果:', result);
    console.log('id:', result[0]?.id);
    console.log('username:', result[0]?.username);
    console.log('createdAt:', result[0]?.createdAt);

    // 2. 清理
    if (result[0]?.id) {
      await db.delete(users).where(users.id.eq(result[0].id));
      console.log('\n2. 清理完成');
    }

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
