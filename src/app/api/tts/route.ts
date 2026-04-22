import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { girlfriendTypes } from '@/lib/game-data';

export const runtime = 'nodejs';

interface TTSRequest {
  text: string;
  girlfriendId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, girlfriendId } = body;

    if (!text) {
      return NextResponse.json({ error: '缺少文本内容' }, { status: 400 });
    }

    // 获取女友类型对应的TTS speaker
    const girlfriend = girlfriendTypes.find(g => g.id === girlfriendId);
    const speaker = girlfriend?.ttsSpeaker || 'zh_female_xiaohe_uranus_bigtts';

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    const response = await client.synthesize({
      uid: 'user_' + Date.now(),
      text,
      speaker,
      audioFormat: 'mp3',
      sampleRate: 24000
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: '语音合成失败' },
      { status: 500 }
    );
  }
}
