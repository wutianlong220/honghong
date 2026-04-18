import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  const client = await pool.connect();

  try {
    console.log('=== 测试用户注册和登录 ===\n');

    // 1. 检查是否已有测试用户
    const existingUser = await client.query(
      "SELECT id, username, password FROM users WHERE username = 'testlogin123'"
    );

    if (existingUser.rows.length > 0) {
      console.log('找到测试用户，删除...');
      await client.query("DELETE FROM users WHERE username = 'testlogin123'");
    }

    // 2. 注册新用户
    console.log('1. 注册新用户 testlogin123...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('testpass123', 10);

    const insertResult = await client.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at`,
      ['testlogin123', hashedPassword]
    );
    console.log('注册成功:', insertResult.rows[0]);

    // 3. 验证密码
    console.log('\n2. 验证密码...');
    const verifyResult = await client.query(
      "SELECT password FROM users WHERE username = 'testlogin123'"
    );

    if (verifyResult.rows.length > 0) {
      const storedPassword = verifyResult.rows[0].password;
      const isValid = await bcrypt.compare('testpass123', storedPassword);
      console.log('密码验证:', isValid ? '✅ 成功' : '❌ 失败');
    }

    // 4. 清理
    await client.query("DELETE FROM users WHERE username = 'testlogin123'");
    console.log('\n3. 测试数据已清理');

  } catch (err) {
    console.error('错误:', err instanceof Error ? err.message : err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

test();
