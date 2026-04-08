'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { scenarios, girlfriendTypes, type Scenario, type GirlfriendType } from '@/lib/game-data';
import { Mic, MicOff, Play, RotateCcw, Volume2, VolumeX, Heart, MessageCircle, BookOpen, Trophy, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

type GamePhase = 'intro' | 'select-scenario' | 'select-girlfriend' | 'playing' | 'result';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // 图片URL
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedGirlfriend, setSelectedGirlfriend] = useState<GirlfriendType | null>(null);
  const [anger, setAnger] = useState(100);
  const [round, setRound] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [audioCache, setAudioCache] = useState<Map<number, string>>(new Map());
  const [summary, setSummary] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'login_required' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 获取当前用户ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch {
        console.error('获取用户信息失败');
      }
    };
    fetchUser();
  }, []);

  // 开始游戏
  const startGame = () => {
    setPhase('select-scenario');
  };

  // 选择场景
  const selectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setPhase('select-girlfriend');
  };

  // 选择女友并开始对话
  const selectGirlfriend = async (girlfriend: GirlfriendType) => {
    setSelectedGirlfriend(girlfriend);
    setPhase('playing');
    setAnger(100);
    setRound(1);
    setMessages([]);
    setIsLoading(true);

    // 获取初始消息
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: '',
          scenarioId: selectedScenario!.id,
          girlfriendId: girlfriend.id,
          currentAnger: 100,
          round: 1
        })
      });
      const data = await response.json();
      
      setMessages([{ role: 'assistant', content: data.response }]);
      // 自动播放语音
      const audioUrl = await getTTS(data.response, girlfriend.id);
      if (audioUrl) {
        playAudio(audioUrl, 0); // 初始消息是第一条消息，索引为0
      }
    } catch (error) {
      console.error('Failed to get initial message:', error);
    }
    setIsLoading(false);
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || round > 5) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          scenarioId: selectedScenario!.id,
          girlfriendId: selectedGirlfriend!.id,
          currentAnger: anger,
          round: round + 1
        })
      });
      const data = await response.json();

      // 先获取语音，然后同时显示文字和播放语音
      const audioUrl = await getTTS(data.response, selectedGirlfriend!.id);
      
      // 同时显示文字和播放语音
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setAnger(data.newAnger);
      setRound(prev => prev + 1);
      
      if (audioUrl) {
        playAudio(audioUrl);
      }

      // 检查是否结束
      if (data.isEnded || round + 1 >= 5) {
        setTimeout(() => endGame(data.newAnger), 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setIsLoading(false);
  };

  // 获取TTS音频URL
  const getTTS = async (text: string, girlfriendId: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, girlfriendId })
      });
      const data = await response.json();
      return data.audioUri || null;
    } catch (error) {
      console.error('TTS error:', error);
      return null;
    }
  };

  // 播放音频
  const playAudio = (audioUrl: string, messageIndex?: number) => {
    // 先停止当前播放的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setIsSpeaking(true);
    setIsPaused(false);
    if (messageIndex !== undefined) {
      setPlayingMessageIndex(messageIndex);
    }
    
    audio.onended = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setPlayingMessageIndex(null);
    };
    
    audio.play();
  };

  // 暂停/继续播放
  const toggleAudio = () => {
    if (!currentAudio) return;
    
    if (isPaused) {
      // 继续播放
      currentAudio.play();
      setIsPaused(false);
      setIsSpeaking(true);
    } else {
      // 暂停播放
      currentAudio.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  // 播放消息语音（用于消息气泡的播放按钮）
  const speakMessage = async (text: string, girlfriendId: string, messageIndex: number) => {
    // 如果点击的是当前正在播放的消息
    if (playingMessageIndex === messageIndex && currentAudio) {
      toggleAudio();
      return;
    }
    
    // 播放新的消息
    const audioUrl = await getTTS(text, girlfriendId);
    if (audioUrl) {
      playAudio(audioUrl, messageIndex);
    }
  };

  // 播放点评（用于结果页面）
  const speakSummary = async (text: string, girlfriendId: string) => {
    // 如果正在播放点评，则暂停/继续
    if (playingMessageIndex === -1 && currentAudio) {
      toggleAudio();
      return;
    }
    
    // 播放新的点评
    const audioUrl = await getTTS(text, girlfriendId);
    if (audioUrl) {
      playAudio(audioUrl, -1); // -1 表示播放的是点评
    }
  };

  // 录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const asrResponse = await fetch('/api/asr', {
        method: 'POST',
        body: formData
      });
      const asrData = await asrResponse.json();

      if (asrData.text) {
        setInputText(asrData.text);
      }
    } catch (error) {
      console.error('ASR error:', error);
      alert('语音识别失败，请重试');
    }
    setIsLoading(false);
  };

  // 结束游戏
  const endGame = async (finalAnger: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario!.id,
          girlfriendId: selectedGirlfriend!.id,
          finalAnger,
          rounds: round + 1,
          conversationHistory: messages
        })
      });
      const data = await response.json();
      
      setRating(data.rating);
      setSummary(data.summary);
      setPhase('result');

      // 保存游戏记录
      const finalScore = 100 - finalAnger; // 好感度分数 = 100 - 生气值
      const result = finalAnger <= 60 ? '通关' : '失败'; // 生气值≤60为通关

      if (currentUserId) {
        // 已登录，保存记录
        setSaveStatus('saving');
        try {
          const saveResponse = await fetch('/api/game-records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scenario: selectedScenario!.title,
              finalScore,
              result,
            }),
          });
          
          if (saveResponse.ok) {
            setSaveStatus('saved');
          } else {
            console.error('保存游戏记录失败');
            setSaveStatus(null);
          }
        } catch (error) {
          console.error('保存游戏记录失败:', error);
          setSaveStatus(null);
        }
      } else {
        // 未登录，提示登录
        setSaveStatus('login_required');
      }
    } catch (error) {
      console.error('Summary error:', error);
    }
    setIsLoading(false);
  };

  // 重新开始
  const restart = () => {
    setPhase('intro');
    setSelectedScenario(null);
    setSelectedGirlfriend(null);
    setAnger(100);
    setRound(1);
    setMessages([]);
    setInputText('');
    setSummary('');
    setRating('');
    setSaveStatus(null);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setPlayingMessageIndex(null);
  };

  // 获取生气值颜色
  const getAngerColor = () => {
    if (anger <= 10) return 'text-green-500';
    if (anger <= 30) return 'text-yellow-500';
    if (anger <= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  // 获取生气值进度条颜色
  const getAngerProgressColor = () => {
    if (anger <= 10) return 'bg-green-500';
    if (anger <= 30) return 'bg-yellow-500';
    if (anger <= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 获取难度文本
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* 标题 */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="w-48 flex-shrink-0" /> {/* 占位符 */}
            <h1 className="text-4xl font-bold text-pink-600 dark:text-pink-400 flex items-center gap-2">
              <Heart className="w-10 h-10" />
              哄哄模拟器
              <Heart className="w-10 h-10" />
            </h1>
            <div className="w-48 flex justify-end flex-shrink-0">
              <UserMenu />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">练习哄女朋友的正确姿势</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/blog">
              <Button variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                恋爱攻略
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" className="gap-2">
                <Trophy className="w-4 h-4" />
                排行榜
              </Button>
            </Link>
          </div>
        </header>

        {/* 介绍页面 */}
        {phase === 'intro' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">欢迎来到哄哄模拟器</CardTitle>
              <CardDescription>
                在这里，你可以练习如何哄生气的女朋友
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">游戏规则</h3>
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                  <li>1. 选择一个让你女朋友生气的场景</li>
                  <li>2. 选择你女朋友的性格类型</li>
                  <li>3. 通过对话让她的生气值降到0</li>
                  <li>4. 生气值≤60为及格，≤30为良好，≤10为优秀</li>
                  <li>5. 每局最多5轮对话</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                size="lg"
                onClick={startGame}
              >
                开始游戏
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 选择场景 */}
        {phase === 'select-scenario' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">选择场景</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              你做错了什么让女朋友生气？
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <Card 
                  key={scenario.id}
                  className="cursor-pointer hover:border-pink-400 transition-all hover:shadow-lg"
                  onClick={() => selectScenario(scenario)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {getDifficultyText(scenario.difficulty)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {scenario.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setPhase('intro')}
            >
              返回
            </Button>
          </div>
        )}

        {/* 选择女友 */}
        {phase === 'select-girlfriend' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">选择女友类型</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              你的女朋友是什么性格？
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {girlfriendTypes.map((gf) => (
                <Card 
                  key={gf.id}
                  className="cursor-pointer hover:border-pink-400 transition-all hover:shadow-lg"
                  onClick={() => selectGirlfriend(gf)}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{gf.avatar}</div>
                    <CardTitle className="text-lg">{gf.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {gf.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-center">
                      性格：{gf.personality}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setPhase('select-scenario')}
            >
              返回选择场景
            </Button>
          </div>
        )}

        {/* 对话界面 */}
        {phase === 'playing' && selectedScenario && selectedGirlfriend && (
          <div className="space-y-4">
            {/* 顶部状态栏 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedGirlfriend.avatar}</span>
                    <div>
                      <div className="font-semibold">{selectedGirlfriend.name}</div>
                      <div className="text-sm text-gray-500">{selectedScenario.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">第 {Math.min(round, 5)} / 5 轮</div>
                    <div className={`text-2xl font-bold ${getAngerColor()}`}>
                      生气值：{anger}
                    </div>
                  </div>
                </div>
                <Progress 
                  value={anger} 
                  className="h-3"
                />
              </CardContent>
            </Card>

            {/* 对话区域 */}
            <Card className="h-96 overflow-hidden">
              <CardContent className="p-4 h-full overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-pink-100 dark:bg-pink-900/30 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === 'assistant' ? (
                            <>
                              <span>{selectedGirlfriend.avatar}</span>
                              <span className="text-xs opacity-70">{selectedGirlfriend.name}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs opacity-70">你</span>
                              <MessageCircle className="w-4 h-4" />
                            </>
                          )}
                        </div>
                        <div>{msg.content}</div>
                        {msg.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-6 px-2"
                            onClick={() => speakMessage(msg.content, selectedGirlfriend.id, index)}
                          >
                            {playingMessageIndex === index && !isPaused ? (
                              <>
                                <VolumeX className="w-3 h-3 mr-1" />
                                暂停
                              </>
                            ) : playingMessageIndex === index && isPaused ? (
                              <>
                                <Volume2 className="w-3 h-3 mr-1" />
                                继续
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 mr-1" />
                                播放
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{selectedGirlfriend.avatar}</span>
                          <span className="animate-pulse">正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* 输入区域 */}
            <Card>
              <CardContent className="p-4">
                {/* 图片预览 */}
                {selectedImage && (
                  <div className="mb-3 relative inline-block">
                    <img 
                      src={selectedImage} 
                      alt="预览图片" 
                      className="max-h-32 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant={isRecording ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || round > 5}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => handleImageUpload(e)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isLoading || round > 5}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="输入你想说的话，或点击麦克风录音..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading || round > 5}
                  />
                  <Button 
                    className="bg-pink-500 hover:bg-pink-600"
                    onClick={sendMessage}
                    disabled={isLoading || (!inputText.trim() && !selectedImage) || round > 5}
                  >
                    发送
                  </Button>
                </div>
                {isRecording && (
                  <div className="mt-2 text-center text-red-500 animate-pulse">
                    正在录音...点击停止
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={restart}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          </div>
        )}

        {/* 结果页面 */}
        {phase === 'result' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">游戏结束</CardTitle>
              <CardDescription>
                {selectedScenario?.title} - {selectedGirlfriend?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 评分 */}
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${
                  rating === '优秀' ? 'text-green-500' :
                  rating === '良好' ? 'text-yellow-500' :
                  rating === '及格' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {rating}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  最终生气值：{anger} / 100
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  对话轮数：{Math.min(round, 5)} 轮
                </div>
              </div>

              {/* 保存状态提示 */}
              {saveStatus === 'saving' && (
                <div className="text-center text-gray-500 text-sm">
                  正在保存游戏记录...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="text-center text-green-600 text-sm font-medium">
                  ✓ 您的游戏记录已经保存
                </div>
              )}
              {saveStatus === 'login_required' && (
                <div className="text-center text-orange-600 text-sm">
                  <span>登录后可保存你的游戏记录，</span>
                  <Link href="/login" className="text-pink-500 hover:text-pink-600 underline">
                    立即登录
                  </Link>
                </div>
              )}

              {/* 点评 */}
              {summary && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span>{selectedGirlfriend?.avatar}</span>
                    {selectedGirlfriend?.name}的点评
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {summary}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => speakSummary(summary, selectedGirlfriend!.id)}
                  >
                    {playingMessageIndex === -1 && !isPaused ? (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        暂停播放
                      </>
                    ) : playingMessageIndex === -1 && isPaused ? (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        继续播放
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        播放点评
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPhase('select-scenario')}
                >
                  选择其他场景
                </Button>
                <Button 
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                  onClick={restart}
                >
                  再玩一次
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 页脚 */}
        <footer className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>仅供娱乐，请珍惜身边人</p>
        </footer>
      </div>
    </div>
  );
}
