import { db } from '@/storage/database/drizzle';
import { blogPosts } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

// 博客文章类型定义
export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  author: string;
  tags: string[];
  readTime: string;
  createdAt: string;
}

// 将数据库行转换为BlogPost对象
function rowToPost(row: typeof blogPosts.$inferSelect): BlogPost {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    author: row.author,
    tags: row.tags ? row.tags.split(',') : [],
    readTime: row.readTime,
    createdAt: row.createdAt,
  };
}

// 获取所有博客文章
export async function getAllPosts(): Promise<BlogPost[]> {
  const result = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));

  return result.map(rowToPost);
}

// 根据ID获取单篇文章
export async function getPostById(id: number): Promise<BlogPost | null> {
  const result = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return rowToPost(result[0]);
}

// 创建新文章
export async function createPost(post: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost> {
  const result = await db
    .insert(blogPosts)
    .values({
      title: post.title,
      summary: post.summary,
      content: post.content,
      author: post.author,
      tags: post.tags.join(','),
      readTime: post.readTime,
    })
    .returning();

  return rowToPost(result[0]);
}

// 批量创建文章
export async function createPosts(posts: Array<Omit<BlogPost, 'id' | 'createdAt'>>): Promise<void> {
  const rows = posts.map(post => ({
    title: post.title,
    summary: post.summary,
    content: post.content,
    author: post.author,
    tags: post.tags.join(','),
    readTime: post.readTime,
  }));

  await db.insert(blogPosts).values(rows);
}
