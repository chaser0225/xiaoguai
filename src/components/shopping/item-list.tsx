'use client';

import { ShoppingItem } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  ShoppingBag,
  Check,
  Trash2,
  Clock,
  Tag,
  Copy,
} from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  onUpdateStatus: (id: string, status: ShoppingItem['status']) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  pending: {
    label: '待购',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  purchased: {
    label: '已购',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  removed: {
    label: '已移除',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    dotColor: 'bg-gray-400',
  },
};

const sourceTypeLabels = {
  taobao_link: '淘宝',
  tmall_link: '天猫',
  taobao_code: '口令',
  manual: '手动',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isSameYear) {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTaobaoAppUrl(item: ShoppingItem): string {
  const itemIdMatch = item.taobaoUrl.match(/[?&]id=(\d+)/);
  if (itemIdMatch) {
    const itemId = itemIdMatch[1];
    return `taobao://item.taobao.com/item.htm?id=${itemId}`;
  }
  return item.taobaoUrl.replace(/^https?/, 'taobao');
}

export function ItemCard({ item, onUpdateStatus, onDelete }: ItemCardProps) {
  const status = statusConfig[item.status];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.rawInput);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = item.rawInput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleOpenTaobao = () => {
    const appUrl = getTaobaoAppUrl(item);
    const webUrl = item.taobaoUrl;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = appUrl;
      setTimeout(() => {
        if (!document.hidden) {
          window.open(webUrl, '_blank');
        }
      }, 2000);
    } else {
      window.open(webUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定删除？')) {
      onDelete(item.id);
    }
  };

  return (
    <Card className="group border border-gray-100 bg-white hover:shadow-md transition-all duration-200">
      <CardContent className="p-3">
        {/* 第一行：状态 + 来源 + 日期 */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`${status.color} text-[10px] px-1.5 py-0 h-5 font-medium`}
            >
              <span className={`w-1 h-1 rounded-full ${status.dotColor} mr-1`} />
              {status.label}
            </Badge>
            <span className="text-[10px] text-gray-400">
              {sourceTypeLabels[item.sourceType]}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {formatDate(item.addedAt)}
          </div>
        </div>

        {/* 商品标题 */}
        <h4 className="font-medium text-gray-800 text-sm mb-1.5 line-clamp-2 leading-snug">
          {item.title}
        </h4>

        {/* 价格 */}
        {item.price && (
          <p className="text-sm font-bold text-orange-600 mb-1.5">
            {item.price.startsWith('¥') ? item.price : `¥${item.price}`}
          </p>
        )}

        {/* 操作按钮 - 紧凑排列 */}
        <div className="flex items-center gap-1.5">
          {item.status === 'pending' && (
            <Button
              size="sm"
              onClick={handleOpenTaobao}
              className="flex-1 h-7 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs shadow-sm px-2"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              购买
            </Button>
          )}

          {item.status === 'purchased' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenTaobao}
              className="flex-1 h-7 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              再买
            </Button>
          )}

          {item.sourceType === 'taobao_code' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="h-7 w-7 rounded-lg border-gray-200 hover:border-orange-300 p-0"
              title="复制口令"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}

          {item.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(item.id, 'purchased')}
              className="h-7 w-7 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 p-0"
              title="标记已购"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}

          {item.status === 'purchased' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(item.id, 'pending')}
              className="h-7 w-7 rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50 p-0"
              title="重新购买"
            >
              <Tag className="w-3 h-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="h-7 w-7 rounded-lg border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 p-0"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ItemListProps {
  items: ShoppingItem[];
  onUpdateStatus: (id: string, status: ShoppingItem['status']) => void;
  onDelete: (id: string) => void;
  filter: 'all' | 'pending' | 'purchased';
}

export function ItemList({
  items,
  onUpdateStatus,
  onDelete,
  filter,
}: ItemListProps) {
  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((item) => item.status === filter);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-orange-300" />
        </div>
        <p className="text-gray-400 text-sm">
          {filter === 'all'
            ? '清单空空如也，快来添加第一件商品吧'
            : filter === 'pending'
              ? '没有待购买的商品'
              : '还没有已购买的商品'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filteredItems.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}