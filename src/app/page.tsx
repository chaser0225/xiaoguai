'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoginForm } from '@/components/shopping/login-form';
import { AddItemForm } from '@/components/shopping/add-item-form';
import { ItemList } from '@/components/shopping/item-list';
import { ChangePasswordDialog } from '@/components/shopping/change-password-dialog';
import { ShoppingItem } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  LogOut,
  Package,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';

type FilterType = 'all' | 'pending' | 'purchased';

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  // 检查已有登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        if (res.ok) {
          setToken('cookie');
        }
      } catch {
        // 未登录
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 获取商品列表
  const fetchItems = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // 忽略错误
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 登录
  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  // 登出
  const handleLogout = async () => {
    setToken(null);
    setItems([]);
  };

  // 添加商品
  const handleAddItem = async (data: {
    input: string;
    title?: string;
    price?: string;
  }) => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '添加失败');
    }

    await fetchItems();
  };

  // 更新状态
  const handleUpdateStatus = async (id: string, status: ShoppingItem['status']) => {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      await fetchItems();
    }
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchItems();
      } else {
        alert('删除失败，请重试');
      }
    } catch {
      alert('网络错误，请重试');
    }
  };

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-200" />
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录
  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // 统计数据
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const purchasedCount = items.filter((i) => i.status === 'purchased').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-base leading-tight">
                共享购物清单
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 手机端统计 */}
            <div className="flex sm:hidden items-center gap-1 mr-1">
              <span className="text-xs text-amber-600 font-medium">{pendingCount}待购</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-emerald-600 font-medium">{purchasedCount}已购</span>
            </div>
            {/* PC端统计 */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 border border-amber-200"
              >
                <Package className="w-3 h-3 mr-1" />
                {pendingCount} 待购
              </Badge>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {purchasedCount} 已购
              </Badge>
            </div>
            <ChangePasswordDialog />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 添加商品 */}
        <AddItemForm onAdd={handleAddItem} />

        {/* 筛选标签 */}
        <div className="flex items-center gap-2">
          {([
            { key: 'all', label: '全部', icon: LayoutGrid, count: items.length },
            { key: 'pending', label: '待购买', icon: Package, count: pendingCount },
            { key: 'purchased', label: '已购买', icon: CheckCircle2, count: purchasedCount },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span
                className={`ml-0.5 text-xs ${
                  filter === key ? 'text-orange-100' : 'text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* 商品列表 */}
        <ItemList
          items={items}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          filter={filter}
        />
      </main>

      {/* 底部 */}
      <footer className="py-6 text-center">
        <p className="text-xs text-gray-300">
          粘贴淘口令或淘宝链接即可添加商品 · 手机点击「去购买」直接打开淘宝APP
        </p>
      </footer>
    </div>
  );
}
