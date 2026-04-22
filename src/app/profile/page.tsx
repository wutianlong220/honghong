'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Gamepad2, Calendar, Clock, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  avgScore: number;
  bestScore: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (!data.success || !data.user) {
        window.location.href = '/login';
        return;
      }

      setUser(data.user);

      const recordsResponse = await fetch('/api/game-records/my-records');
      const recordsData = await recordsResponse.json();
      
      if (recordsData.success) {
        setRecords(recordsData.records);
        setStats(recordsData.stats);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '未知时间';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </Link>

        {/* 用户信息 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Gamepad2 className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalGames}</div>
                <div className="text-sm text-gray-500">总场次</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.wins}</div>
                <div className="text-sm text-gray-500">通关次数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.avgScore}</div>
                <div className="text-sm text-gray-500">平均好感度</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.bestScore}</div>
                <div className="text-sm text-gray-500">最高好感度</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 游戏记录列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              游戏历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无游戏记录</p>
                <Link href="/">
                  <Button className="mt-4 bg-pink-500 hover:bg-pink-600 text-white">
                    开始游戏
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.result === '通关' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {record.result === '通关' ? '🎉' : '😢'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{record.scenario}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(record.played_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        record.result === '通关' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.result}
                      </div>
                      <div className="text-sm text-gray-500">
                        好感度: {record.final_score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
