import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置');
  console.log('请确保 .env.local 文件存在且包含 DATABASE_URL');
  process.exit(1);
}

console.log('连接字符串:', DATABASE_URL.substring(0, 50) + '...\n');

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function check() {
  console.log('正在连接 Neon 数据库...\n');

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');

    // 查询所有表
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('=== Neon 数据库状态 ===\n');

    if (tables.rows.length === 0) {
      console.log('📭 数据库中没有表');
      console.log('\n提示: 需要创建表或导入数据到 Neon');
    } else {
      console.log('📋 存在的表:');
      tables.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }

    // 分别检查每个表的数据量
    const tableNames = ['blog_posts', 'users', 'game_records'];

    for (const name of tableNames) {
      try {
        const count = await client.query(`SELECT COUNT(*) as cnt FROM ${name}`);
        console.log(`\n📊 ${name}: ${count.rows[0].cnt} 条记录`);
      } catch (e: any) {
        console.log(`\n📊 ${name}: 表不存在`);
      }
    }

    client.release();
  } catch (err: any) {
    console.error('❌ 连接失败:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
