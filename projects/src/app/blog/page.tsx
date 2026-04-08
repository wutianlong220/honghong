import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { getAllPosts } from '@/lib/blog-service';
import BlogActions from '@/components/BlogActions';

export default async function BlogPage() {
  const posts = await getAllPosts().catch(() => []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Link>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            恋爱攻略
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            从这里学习恋爱技巧，成为哄女友高手
          </p>
        </div>

        {/* AI生成文章按钮 */}
        <div className="flex justify-center mb-8">
          <BlogActions />
        </div>

        {/* 文章列表 */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{post.summary}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.read_time}
                </span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-pink-50 text-pink-600 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无文章，请点击上方按钮生成或
              <Link href="/api/blog/migrate" className="text-pink-600 hover:underline ml-1">
                迁移初始数据
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
