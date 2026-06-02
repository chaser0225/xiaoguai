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
  Image as ImageIcon,
} from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  onUpdateStatus: (id: string, status: ShoppingItem['status']) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  pending: {
    label: '待购买',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  purchased: {
    label: '已购买',
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
  taobao_link: '淘宝链接',
  tmall_link: '天猫链接',
  taobao_code: '淘口令',
  manual: '手动输入',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 生成淘宝 APP Deep Link
 * - 手机端会直接唤起淘宝APP打开商品页
 * - PC 端等不支持的场景会 fallback 到浏览器打开
 */
function getTaobaoAppUrl(item: ShoppingItem): string {
  // 从 URL 中提取商品 ID
  const itemIdMatch = item.taobaoUrl.match(/[?&]id=(\d+)/);
  if (itemIdMatch) {
    const itemId = itemIdMatch[1];
    // 淘宝 APP URL Scheme
    return `taobao://item.taobao.com/item.htm?id=${itemId}`;
  }
  // 如果是短链接，直接用 taobao:// scheme 替换
  return item.taobaoUrl.replace(/^https?/, 'taobao');
}

export function ItemCard({ item, onUpdateStatus, onDelete }: ItemCardProps) {
  const status = statusConfig[item.status];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.rawInput);
    } catch {
      // fallback: 使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = item.rawInput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleOpenTaobao = () => {
    // 尝试使用淘宝 APP Deep Link 唤起
    const appUrl = getTaobaoAppUrl(item);
    const webUrl = item.taobaoUrl;

    // 检测是否为移动端
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // 移动端：先尝试唤起 APP，2秒后 fallback 到网页
      window.location.href = appUrl;
      setTimeout(() => {
        // 如果 APP 没有被唤起（页面还在），就打开网页版
        if (!document.hidden) {
          window.open(webUrl, '_blank');
        }
      }, 2000);
    } else {
      // PC 端：直接打开网页
      window.open(webUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个商品吗？')) {
      onDelete(item.id);
    }
  };

  return (
    <Card className="group border border-gray-100 bg-white hover:shadow-lg hover:shadow-orange-100/30 hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-4">
        {/* 商品图片 */}
        {item.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden bg-gray-50 aspect-square max-h-48 flex items-center justify-center">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // 图片加载失败时隐藏
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* 无图片占位 */}
        {!item.imageUrl && (
          <div className="mb-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 aspect-[4/3] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-orange-200" />
          </div>
        )}

        {/* 顶部：状态标签 + 来源 */}
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant="outline"
            className={`${status.color} text-xs font-medium`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${status.dotColor} mr-1.5`}
            />
            {status.label}
          </Badge>
          <span className="text-xs text-gray-400">
            {sourceTypeLabels[item.sourceType]}
          </span>
        </div>

        {/* 商品标题 */}
        <h4 className="font-semibold text-gray-800 text-base mb-2 line-clamp-2 leading-snug">
          {item.title}
        </h4>

        {/* 价格 */}
        {item.price && (
          <p className="text-lg font-bold text-orange-600 mb-2">
            {item.price.startsWith('¥') ? item.price : `¥${item.price}`}
          </p>
        )}

        {/* 时间 */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Clock className="w-3 h-3" />
          {formatTime(item.addedAt)}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {item.status === 'pending' && (
            <Button
              size="sm"
              onClick={handleOpenTaobao}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              去购买
            </Button>
          )}

          {item.status === 'purchased' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenTaobao}
              className="flex-1 h-10 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              再次购买
            </Button>
          )}

          {item.sourceType === 'taobao_code' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="h-10 rounded-xl border-gray-200 hover:border-orange-300 px-3"
              title="复制淘口令"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}

          {item.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(item.id, 'purchased')}
              className="h-10 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-3"
              title="标记为已购买"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}

          {item.status === 'purchased' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(item.id, 'pending')}
              className="h-10 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 px-3"
              title="重新购买"
            >
              <Tag className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="h-10 rounded-xl border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 px-3"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
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
      <div className="text-center py-16">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-orange-300" />
        </div>
        <p className="text-gray-400 text-base">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
