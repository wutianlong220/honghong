import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog-service';

export const runtime = 'nodejs';


// 获取所有博客文章
export async function GET(request: NextRequest) {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      },
      { status: 500 }
    );
  }
}
