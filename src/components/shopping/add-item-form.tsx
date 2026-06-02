'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  X,
  Link2,
  Sparkles,
  Tag,
  Loader2,
} from 'lucide-react';

interface AddItemFormProps {
  onAdd: (data: {
    input: string;
    title?: string;
    price?: string;
  }) => Promise<void>;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  // 输入变化时自动解析预览
  const handleInputChange = (value: string) => {
    setInput(value);
    // 如果包含链接或淘口令，自动解析
    if (
      value.includes('taobao.com') ||
      value.includes('tmall.com') ||
      value.includes('tb.cn') ||
      /[￥$₳₤£¢€¥]/.test(value)
    ) {
      autoParse(value.trim());
    }
  };

  const autoParse = async (text: string) => {
    if (!text) return;
    setParsing(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.parsed?.title && !title) {
          setTitle(data.parsed.title);
        }
        if (data.parsed?.imageUrl) {
          // 图片 URL 存在但不在表单中展示，提交时会用到
        }
      }
    } catch {
      // 解析失败不阻塞
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        input: input.trim(),
        title: title.trim() || undefined,
        price: price.trim() || undefined,
      });
      // 清空表单
      setInput('');
      setTitle('');
      setPrice('');
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg shadow-orange-200 transition-all duration-200 active:scale-[0.98] text-base"
      >
        <Plus className="w-5 h-5 mr-2" />
        添加商品到清单
      </Button>
    );
  }

  return (
    <Card className="border-2 border-orange-200 bg-white shadow-lg shadow-orange-100/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 顶部关闭按钮 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              添加新商品
            </h3>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 淘口令/链接输入 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-orange-500" />
              淘口令 / 商品链接
              <span className="text-red-400">*</span>
              {parsing && (
                <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
              )}
            </label>
            <Textarea
              placeholder="粘贴淘口令（如 ￥ABC123xyz￥）、淘宝/天猫链接，或直接输入商品名称"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="min-h-[80px] rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400 resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              支持淘口令、taobao.com/tmall.com 链接、m.tb.cn 短链接
            </p>
          </div>

          {/* 商品名称（可选） */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-500" />
              商品名称
              <span className="text-gray-400 text-xs">（可选，覆盖自动识别）</span>
            </label>
            <Input
              placeholder="给商品起个名字，方便识别"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400"
              disabled={loading}
            />
          </div>

          {/* 价格 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              价格
              <span className="text-gray-400 text-xs ml-1">（可选）</span>
            </label>
            <Input
              placeholder="如 ¥99.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400"
              disabled={loading}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-md shadow-orange-200"
              disabled={loading || !input.trim()}
            >
              {loading ? '添加中...' : '确认添加'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-gray-200"
              onClick={() => setExpanded(false)}
              disabled={loading}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
