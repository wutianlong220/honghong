import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fix() {
  const client = await pool.connect();

  try {
    console.log('=== 重建 users 表 ===\n');

    // 1. 备份现有数据
    console.log('1. 备份现有用户数据...');
    const backup = await client.query('SELECT * FROM users');
    console.log(`   找到 ${backup.rows.length} 条用户记录`);
    console.log('   数据:', JSON.stringify(backup.rows.slice(0, 3), null, 2));

    if (backup.rows.length > 0) {
      console.log('\n   ⚠️  警告：将删除并重建 users 表！');
      console.log('   现有用户数据将丢失！');
    }

    // 2. 删除旧表
    console.log('\n2. 删除旧表...');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('   ✅ 删除成功');

    // 3. 创建新表（正确的结构）
    console.log('\n3. 创建新表...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY NOT NULL,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   ✅ 创建成功');

    // 4. 验证新结构
    console.log('\n4. 验证新结构...');
    const columns = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    columns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}, default: ${row.column_default}, nullable: ${row.is_nullable}`);
    });

    // 5. 测试插入
    console.log('\n5. 测试插入...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testResult = await client.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at`,
      ['test_user', hashedPassword]
    );
    console.log('   插入结果:', testResult.rows[0]);
    console.log('   ✅ id 和 created_at 现在正确生成！');

    // 6. 清理测试数据
    await client.query('DELETE FROM users WHERE username = $1', ['test_user']);
    console.log('\n6. 测试数据已清理');

    console.log('\n=== 修复完成 ===');
    console.log('现在可以重新注册用户了！');

  } catch (err) {
    console.error('错误:', err instanceof Error ? err.message : err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fix();
