import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const client = await pool.connect();

  try {
    console.log('=== 检查表结构 ===\n');

    // game_records 结构
    const gameStruct = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'game_records'
    `);
    console.log('game_records 表结构:');
    gameStruct.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // game_records 数据
    const games = await client.query('SELECT * FROM game_records');
    console.log('\ngame_records 数据:');
    if (games.rows.length === 0) {
      console.log('  (无数据)');
    } else {
      console.log(JSON.stringify(games.rows[0], null, 2));
    }

    // users 结构
    const userStruct = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
    `);
    console.log('\n\nusers 表结构:');
    userStruct.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // users 数据样例
    const users = await client.query('SELECT * FROM users LIMIT 1');
    console.log('\nusers 数据样例:');
    if (users.rows.length === 0) {
      console.log('  (无数据)');
    } else {
      console.log(JSON.stringify(users.rows[0], null, 2));
    }

  } catch (err) {
    console.error('错误:', err instanceof Error ? err.message : err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

check();
