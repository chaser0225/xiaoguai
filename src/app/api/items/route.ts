import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllItems, addItem, updateItemInfo } from '@/lib/store';
import { parseInput, extractTitle } from '@/lib/taobao-parser';

// 获取所有商品
export async function GET(request: NextRequest) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { error: '未授权，请先登录' },
      { status: 401 }
    );
  }

  try {
    const items = await getAllItems();
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('获取商品列表错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error.message || '未知错误') },
      { status: 500 }
    );
  }
}

// 添加新商品
export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { error: '未授权，请先登录' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { input, title: manualTitle, price: manualPrice } = body as {
      input: string;
      title?: string;
      price?: string;
    };

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: '请输入淘口令或商品链接' },
        { status: 400 }
      );
    }

    // 解析输入
    const parsed = parseInput(input.trim());
    const displayTitle = manualTitle || extractTitle(input.trim(), parsed);

    const item = await addItem({
      title: displayTitle,
      taobaoUrl: parsed.taobaoUrl,
      imageUrl: parsed.imageUrl,
      price: manualPrice || parsed.price,
      sourceType: parsed.sourceType,
      rawInput: input.trim(),
    });

    // 异步尝试提取标题和图片（不阻塞响应）
    if (parsed.taobaoUrl && parsed.sourceType !== 'manual' && !manualTitle) {
      setTimeout(async () => {
        try {
          // 动态导入！避免 Netlify 上模块不存在导致崩溃
          const { FetchClient, Config } = await import('coze-coding-dev-sdk');
          const config = new Config();
          const client = new FetchClient(config);
          const response = await client.fetch(parsed.taobaoUrl);

          let fetchedTitle = '';
          let fetchedImageUrl = '';

          if (response.status_code === 0 && response.title) {
            fetchedTitle = response.title;
          }

          if (response.status_code === 0 && response.content) {
            const firstImage = response.content.find(
              (c: any) => c.type === 'image' && c.image?.display_url
            );
            if (firstImage?.image?.thumbnail_display_url) {
              fetchedImageUrl = firstImage.image.thumbnail_display_url;
            } else if (firstImage?.image?.display_url) {
              fetchedImageUrl = firstImage.image.display_url;
            }
          }

          if (fetchedTitle || fetchedImageUrl) {
            await updateItemInfo(item.id, {
              title: fetchedTitle || undefined,
              imageUrl: fetchedImageUrl || undefined,
            });
          }
        } catch (err) {
          console.error('后台提取失败:', err);
        }
      }, 0);
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error('添加商品错误:', error);
    return NextResponse.json(
      { error: '添加商品失败: ' + (error.message || '未知错误') },
      { status: 500 }
    );
  }
}