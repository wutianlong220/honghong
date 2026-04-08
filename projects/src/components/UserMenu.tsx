'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';

interface UserInfo {
  id: number;
  username: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      console.error('获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      window.location.href = '/';
    } catch {
      console.error('登出失败');
    }
  };

  // 用户信息加载中
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-pink-100 animate-pulse" />
    );
  }

  // 未登录状态：显示登录和注册按钮
  if (!user) {
    return (
      <div className="flex items-center gap-2 flex-nowrap">
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-pink-600 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <LogIn className="w-4 h-4" />
          登录
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:from-pink-600 hover:to-rose-600 transition-all text-sm font-medium shadow-sm whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          注册
        </Link>
      </div>
    );
  }

  // 已登录状态：显示用户名和退出登录按钮
  return (
    <div className="flex items-center gap-3 flex-nowrap">
      <Link 
        href="/profile"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700">{user.username}</span>
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors text-sm whitespace-nowrap"
      >
        <LogOut className="w-4 h-4" />
        退出
      </button>
    </div>
  );
}
