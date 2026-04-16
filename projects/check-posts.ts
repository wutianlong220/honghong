import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const client = await pool.connect();

  try {
    console.log('=== 检查 blog_posts created_at ===\n');

    const result = await client.query('SELECT id, title, created_at FROM blog_posts ORDER BY id');
    console.log(`共 ${result.rows.length} 条记录:\n`);

    result.rows.forEach(row => {
      const date = new Date(row.created_at);
      const isValid = !isNaN(date.getTime());
      console.log(`ID ${row.id}: "${row.created_at}" -> ${isValid ? '✅' : '❌'}`);
    });

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

check();
