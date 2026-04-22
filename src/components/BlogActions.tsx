'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface BlogActionsProps {
  onArticleGenerated?: () => void;
}

export default function BlogActions({ onArticleGenerated }: BlogActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage('');

    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ 文章《${data.post.title}》生成成功！`);
        // 刷新页面以显示新文章
        if (onArticleGenerated) {
          onArticleGenerated();
        } else {
          window.location.reload();
        }
      } else {
        setMessage(`❌ ${data.error || '生成失败，请重试'}`);
      }
    } catch (error) {
      setMessage('❌ 网络错误，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-8">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI正在创作中...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI生成新文章
          </>
        )}
      </button>
      
      {message && (
        <p className={`mt-3 text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
