import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { createPost } from '@/lib/blog-service';

export const runtime = 'nodejs';


// 文章主题类型
const ARTICLE_TOPICS = [
  '恋爱沟通技巧',
  '情感修复方法',
  '约会攻略',
  '礼物选择指南',
  '异地恋维系',
  '理解女性心理',
  '处理矛盾冲突',
  '增进感情技巧',
  '表白与追求',
  '长期关系经营',
];

interface GenerateRequest {
  topic?: string;
}

// 从Markdown内容中提取标题
function extractTitleFromMarkdown(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.replace('# ', '').trim();
    }
  }
  return null;
}

// 从Markdown内容中提取摘要
function extractSummaryFromMarkdown(content: string): string {
  const lines = content.split('\n');
  let summary = '';
  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过标题、空行和列表项
    if (trimmed.startsWith('#') || trimmed === '' || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      continue;
    }
    // 找到第一个有意义的段落
    if (trimmed.length > 30) {
      summary = trimmed.substring(0, 100);
      if (trimmed.length > 100) {
        summary += '...';
      }
      break;
    }
  }
  return summary || '这是一篇关于恋爱技巧的实用文章';
}

// 估算阅读时间
function estimateReadTime(content: string): string {
  const wordCount = content.length;
  const minutes = Math.max(1, Math.ceil(wordCount / 400)); // 假设每分钟阅读400字
  return `${minutes}分钟`;
}

// LLM生成文章API
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json().catch(() => ({}));
    
    // 选择主题
    const topic = body.topic || ARTICLE_TOPICS[Math.floor(Math.random() * ARTICLE_TOPICS.length)];
    
    // 初始化LLM客户端
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, customHeaders);

    // 构建提示词 - 更明确的格式要求
    const systemPrompt = `你是一位专业的恋爱情感专家和专栏作家。请根据用户给出的主题，撰写一篇高质量的恋爱技巧文章。

文章要求：
1. 标题要吸引人，能引起读者兴趣（使用一级标题 # 标题）
2. 开头要有简短的摘要段落（50-80字）
3. 正文结构清晰，使用二级标题(##)和三级标题(###)分段
4. 内容要实用，包含具体的方法和技巧
5. 适当使用列表(-)和加粗(**)增强可读性
6. 结尾要有总结和鼓励的话语
7. 文章总字数在800-1500字之间

请直接输出Markdown格式的文章内容，不需要包裹在JSON或代码块中。`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请撰写一篇关于"${topic}"的恋爱技巧文章。` },
    ];

    // 调用LLM生成文章
    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    const rawContent = response.content.trim();
    
    // 清理可能的markdown代码块包裹
    let articleContent = rawContent;
    if (articleContent.includes('```markdown')) {
      articleContent = articleContent.replace(/```markdown\s*/g, '').replace(/```\s*/g, '');
    } else if (articleContent.includes('```')) {
      articleContent = articleContent.replace(/```\s*/g, '');
    }
    articleContent = articleContent.trim();

    // 提取标题
    let title = extractTitleFromMarkdown(articleContent);
    if (!title) {
      // 如果没有标题，使用主题作为标题
      title = `${topic}指南`;
      articleContent = `# ${title}\n\n${articleContent}`;
    }

    // 提取摘要
    const summary = extractSummaryFromMarkdown(articleContent);
    
    // 估算阅读时间
    const readTime = estimateReadTime(articleContent);

    // 保存到数据库
    const savedPost = await createPost({
      title,
      summary,
      content: articleContent,
      author: 'AI恋爱专家',
      tags: [topic, '恋爱技巧'],
      readTime: readTime,
    });

    return NextResponse.json({
      success: true,
      message: '文章生成成功',
      post: savedPost,
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成失败',
      },
      { status: 500 }
    );
  }
}
