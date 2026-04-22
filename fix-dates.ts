import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixDates() {
  const client = await pool.connect();

  try {
    console.log('=== 修复 blog_posts 日期格式 ===\n');

    // 获取所有记录
    const result = await client.query('SELECT id, title, created_at FROM blog_posts');

    console.log(`找到 ${result.rows.length} 条记录\n`);

    let fixed = 0;
    for (const row of result.rows) {
      const oldDate = row.created_at;
      const parsedDate = new Date(oldDate);

      if (isNaN(parsedDate.getTime())) {
        console.log(`❌ ID ${row.id}: 无法解析日期 "${oldDate}"`);
        continue;
      }

      // 转换为标准 ISO 格式
      const newDate = parsedDate.toISOString();

      // 更新数据库
      await client.query(
        'UPDATE blog_posts SET created_at = $1 WHERE id = $2',
        [newDate, row.id]
      );

      console.log(`✅ ID ${row.id}: "${oldDate}" -> "${newDate}"`);
      fixed++;
    }

    console.log(`\n完成！成功修复 ${fixed} 条记录`);

  } catch (err) {
    console.error('错误:', err instanceof Error ? err.message : err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fixDates();
