import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

interface SummaryRequest {
  scenarioId: string;
  girlfriendId: string;
  finalAnger: number;
  rounds: number;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();
    const { scenarioId, girlfriendId, finalAnger, rounds, conversationHistory } = body;

    // 计算评级
    let rating: '优秀' | '良好' | '及格' | '不及格';
    if (finalAnger <= 10) {
      rating = '优秀';
    } else if (finalAnger <= 30) {
      rating = '良好';
    } else if (finalAnger <= 60) {
      rating = '及格';
    } else {
      rating = '不及格';
    }

    // 构建对话摘要
    const conversationSummary = conversationHistory
      .map(msg => `${msg.role === 'user' ? '男朋友' : '女朋友'}：${msg.content}`)
      .join('\n');

    // 调用LLM生成点评
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一个恋爱关系顾问，需要点评一场"哄女朋友"的对话表现。

## 对话记录
${conversationSummary}

## 最终结果
- 用了${rounds}轮对话
- 最终生气值：${finalAnger}/100
- 评级：${rating}

## 点评要求
请用女朋友的口吻给出总结点评，包括：
1. 整体表现评价（好不好，为什么）
2. 指出说得好地方（具体哪几句话，为什么好）
3. 指出说得不好的地方（具体哪几句话，为什么不好）
4. 给出改进建议（下次遇到类似情况应该怎么说）

点评要：
- 保持女朋友的角色语气
- 真诚、具体、有建设性
- 不要太长，控制在200字以内`;

    const messages = [
      { role: 'system' as const, content: systemPrompt }
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7
    });

    let summary = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        summary += chunk.content.toString();
      }
    }

    return NextResponse.json({
      rating,
      finalAnger,
      rounds,
      summary
    });

  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: '点评生成失败' },
      { status: 500 }
    );
  }
}
