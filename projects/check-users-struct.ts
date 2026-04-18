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
    const client = await pool.connect();

    console.log('=== 检查 users 表结构 ===\n');

    // 检查表结构
    const columns = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('列信息:');
    columns.rows.forEach(row => {
      console.log(`  ${row.column_name}:`);
      console.log(`    - data_type: ${row.data_type}`);
      console.log(`    - default: ${row.column_default}`);
      console.log(`    - nullable: ${row.is_nullable}`);
    });

    // 测试插入（不指定 id 和 created_at）
    console.log('\n=== 测试插入 ===');
    const testUsername = 'test_' + Date.now();
    const insertResult = await client.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *`,
      [testUsername, '$2b$10$test']
    );
    console.log('插入结果:', insertResult.rows[0]);

    // 检查插入的数据
    console.log('\n=== 验证插入 ===');
    const selectResult = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [testUsername]
    );
    console.log('查询结果:', selectResult.rows[0]);

    // 清理
    if (selectResult.rows[0]?.id) {
      await client.query('DELETE FROM users WHERE id = $1', [selectResult.rows[0].id]);
      console.log('\n清理完成');
    }

    client.release();
  } catch (err) {
    console.error('错误:', err instanceof Error ? err.message : err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
