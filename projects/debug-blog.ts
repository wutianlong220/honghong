import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const client = await pool.connect();

  try {
    console.log('=== 直接查询 blog_posts ===\n');

    // 直接用 SQL 查询原始值
    const result = await client.query('SELECT id, title, created_at FROM blog_posts LIMIT 5');

    for (const row of result.rows) {
      console.log('原始值:', row.created_at);
      console.log('类型:', typeof row.created_at);
    }

    // 尝试更新
    console.log('\n=== 尝试更新 ===');
    const updateResult = await client.query(
      `UPDATE blog_posts SET created_at = '2026-04-16T03:26:24.258Z' WHERE id = 1 RETURNING id, created_at`
    );
    console.log('更新后:', updateResult.rows[0]);

    // 再次查询
    console.log('\n=== 更新后重新查询 ===');
    const result2 = await client.query('SELECT id, title, created_at FROM blog_posts WHERE id = 1');
    console.log('更新后值:', result2.rows[0].created_at);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

check();
