import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    console.log('=== 直接用 pg 测试插入 ===\n');

    const testUsername = 'testpg_' + Date.now();
    const client = await pool.connect();

    // 直接用 SQL 插入
    const result = await client.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at`,
      [testUsername, '$2b$10$test']
    );

    console.log('结果:', result.rows[0]);
    console.log('id:', result.rows[0]?.id);
    console.log('username:', result.rows[0]?.username);
    console.log('created_at:', result.rows[0]?.created_at);

    // 清理
    if (result.rows[0]?.id) {
      await client.query('DELETE FROM users WHERE id = $1', [result.rows[0].id]);
      console.log('\n清理完成');
    }

    client.release();
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
