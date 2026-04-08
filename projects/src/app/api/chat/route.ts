import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { girlfriendTypes, scenarios, difficultyMultiplier } from '@/lib/game-data';

export const runtime = 'nodejs';

// 对话历史存储（实际项目中应该用数据库或Redis）
const conversationHistories = new Map<string, Array<{ role: 'system' | 'user' | 'assistant'; content: string }>>();

interface ChatRequest {
  sessionId: string;
  message: string;
  scenarioId: string;
  girlfriendId: string;
  currentAnger: number;
  round: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { sessionId, message, scenarioId, girlfriendId, currentAnger, round } = body;

    // 获取场景和女友类型
    const scenario = scenarios.find(s => s.id === scenarioId);
    const girlfriend = girlfriendTypes.find(g => g.id === girlfriendId);

    if (!scenario || !girlfriend) {
      return NextResponse.json({ error: '无效的场景或女友类型' }, { status: 400 });
    }

    // 获取或创建对话历史
    if (!conversationHistories.has(sessionId)) {
      // 初始化系统提示
      const systemPrompt = `你是一个角色扮演AI，现在你要扮演用户的${girlfriend.name}女朋友。

## 角色设定
- 性格特点：${girlfriend.personality}
- 回应风格：${girlfriend.responseStyle}
- 当前场景：${scenario.context}
- 初始状态：非常生气，生气值100（满分100）

## 当前情况
${scenario.description}
你刚说了："${scenario.initialMessage}"

## 评分规则
你需要根据男朋友的回应来调整生气值（要宽容一些，多给机会）：
1. **真诚道歉**（承认错误、表达歉意）- 降低15-30分
2. **实际行动承诺**（提出解决方案、承诺改变）- 降低20-35分
3. **情感表达**（表达在乎、爱意）- 降低10-20分
4. **幽默化解**（适当幽默、逗笑）- 降低10-20分（对傲娇型、温柔型更有效）
5. **找借口**（推卸责任、找理由）- 增加5-15分
6. **讲道理**（逻辑辩论、不服气）- 增加5-10分
7. **敷衍应付**（不真诚、走过场）- 增加3-8分
8. **沉默/冷战**（不回应、逃避）- 增加10-20分
9. **指责对方**（反过来说对方问题）- 增加15-25分

注意：
- 多数情况下应该降低生气值，只有在对方明显说错话时才增加
- 如果对方态度诚恳，即使说得不完美也应该给予一定认可
- 每轮至少给对方降5-10分作为基础分（只要不是明显错误）

## 难度调整
- 场景难度：${scenario.difficulty}
- 难度系数：${difficultyMultiplier[scenario.difficulty]}

## 回应要求
1. 保持角色一致性，不要跳出角色
2. 根据${girlfriend.name}的性格特点来回应
3. 每次回应后，在最后用【生气值变化：+X/-X】标记变化值（正数表示增加，负数表示减少）
4. 回应要自然，符合真实情侣对话
5. 如果对方说得好，要表现出心软、感动的情绪变化
6. 如果对方说错话，要表现得更生气

## 重要提示
- 如果这是第1轮，请直接回应："${scenario.initialMessage}"
- 之后每轮都要回应男朋友说的话
- 始终保持${girlfriend.name}的角色特点
- 回应最后必须有【生气值变化：+X/-X】格式的标记`;

      conversationHistories.set(sessionId, [
        { role: 'system', content: systemPrompt }
      ]);
    }

    const history = conversationHistories.get(sessionId)!;

    // 如果是第一轮，直接返回初始消息
    if (round === 1 && history.length === 1) {
      return NextResponse.json({
        response: scenario.initialMessage,
        angerChange: 0,
        newAnger: 100,
        isEnded: false
      });
    }

    // 添加用户消息
    history.push({ role: 'user', content: message });

    // 调用LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 使用流式生成
    const stream = client.stream(history, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        fullResponse += chunk.content.toString();
      }
    }

    // 解析生气值变化
    const angerChangeMatch = fullResponse.match(/【生气值变化：([+-]?\d+)】/);
    let angerChange = 0;
    if (angerChangeMatch) {
      angerChange = parseInt(angerChangeMatch[1]);
      // 移除标记
      fullResponse = fullResponse.replace(/【生气值变化：[+-]?\d+】/g, '').trim();
    }

    // 应用难度系数
    const multiplier = difficultyMultiplier[scenario.difficulty];
    angerChange = Math.round(angerChange * multiplier);

    // 计算新的生气值
    let newAnger = Math.max(0, Math.min(100, currentAnger + angerChange));

    // 添加助手回应到历史
    history.push({ role: 'assistant', content: fullResponse });

    // 判断是否结束（5轮后结束）
    const isEnded = round >= 5 || newAnger <= 10;

    // 如果结束，清理历史
    if (isEnded) {
      conversationHistories.delete(sessionId);
    }

    return NextResponse.json({
      response: fullResponse,
      angerChange,
      newAnger,
      isEnded
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '对话生成失败，请重试' },
      { status: 500 }
    );
  }
}
