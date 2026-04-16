import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Clock, User, Calendar, Tag } from 'lucide-react';
import { getPostById } from '@/lib/blog-service';

interface BlogDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  
  if (isNaN(postId)) {
    notFound();
  }
  
  const post = await getPostById(postId);
  
  if (!post) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <Link
          href="/blog"
          className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Link>

        {/* 文章内容 */}
        <article className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          {/* 标题 */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.read_time}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {(() => {
                const date = new Date(post.created_at);
                if (isNaN(date.getTime())) return '未知时间';
                return format(date, 'yyyy年MM月dd日', { locale: zhCN });
              })()}
            </span>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* 文章摘要 */}
          <p className="text-lg text-gray-700 mb-6 p-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
            {post.summary}
          </p>

          {/* 正文内容 - Markdown渲染为HTML */}
          <div className="prose prose-pink max-w-none">
            {post.content.split('\n').map((line, index) => {
              // 标题
              if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-semibold text-gray-800 mt-6 mb-3">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              
              // 无序列表
              if (line.startsWith('- ')) {
                return (
                  <li key={index} className="text-gray-700 ml-4">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              
              // 空行
              if (line.trim() === '') {
                return <br key={index} />;
              }
              
              // 加粗文本
              let processedLine = line;
              const boldPattern = /\*\*(.*?)\*\*/g;
              if (boldPattern.test(line)) {
                processedLine = line.replace(boldPattern, '<strong>$1</strong>');
                return (
                  <p
                    key={index}
                    className="text-gray-700 leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                  />
                );
              }
              
              // 代码块标记（简化处理）
              if (line.startsWith('```') || line.startsWith('**') || line.startsWith('❌') || line.startsWith('✅')) {
                return (
                  <p key={index} className="text-gray-700 leading-relaxed mb-2 font-mono text-sm bg-gray-50 p-2 rounded">
                    {line}
                  </p>
                );
              }
              
              // 普通段落
              return (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {line}
                </p>
              );
            })}
          </div>
        </article>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/blog"
            className="text-pink-600 hover:text-pink-700 transition-colors"
          >
            ← 查看更多文章
          </Link>
          <span className="text-sm text-gray-500">
            发布于 {(() => {
              const date = new Date(post.created_at);
              if (isNaN(date.getTime())) return '未知时间';
              return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
