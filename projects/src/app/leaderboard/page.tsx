'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Medal, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  scenario: string;
  score: number;
  playedAt: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取当前用户
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch {
        // 未登录，忽略
      }

      // 获取排行榜数据
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300';
      default:
        return 'bg-white border-gray-100';
    }
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

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">排行榜</h1>
          <p className="text-gray-500 mt-2">看看谁是最会哄女朋友的人</p>
        </div>

        {/* 排行榜 */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-purple-50">
            <CardTitle className="flex items-center gap-2 text-pink-600">
              <Trophy className="w-5 h-5" />
              好感度排行 TOP 20
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无排行数据</p>
                <p className="text-sm mt-2">登录后玩游戏即可上榜</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry) => {
                  const isCurrentUser = currentUserId === entry.userId;
                  return (
                    <div
                      key={`${entry.userId}-${entry.playedAt}`}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        isCurrentUser 
                          ? 'bg-pink-50 border-l-4 border-pink-500' 
                          : 'hover:bg-gray-50'
                      } ${getRankStyle(entry.rank)}`}
                    >
                      {/* 排名 */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* 用户信息 */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isCurrentUser ? 'text-pink-600' : 'text-gray-900'}`}>
                          {entry.username}
                          {isCurrentUser && <span className="ml-2 text-xs text-pink-500">(我)</span>}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {entry.scenario}
                        </div>
                      </div>

                      {/* 分数和时间 */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`font-bold text-lg ${isCurrentUser ? 'text-pink-600' : 'text-gray-900'}`}>
                          {entry.score}分
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(entry.playedAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 提示 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>只有登录用户的成绩才会出现在排行榜上</p>
          {currentUserId && (
            <p className="text-pink-500 mt-1">你的记录已高亮显示</p>
          )}
        </div>
      </div>
    </div>
  );
}
