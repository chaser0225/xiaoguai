import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { parseInput, extractTitle } from '@/lib/taobao-parser';

// 检查是否在 Coze 平台环境
let cozeFetchAvailable = false;
try {
  require('coze-coding-dev-sdk');
  cozeFetchAvailable = true;
} catch {
  cozeFetchAvailable = false;
}

// 解析淘口令/链接预览，自动提取标题和图片
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
    const { input } = body as { input: string };

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: '请输入内容' },
        { status: 400 }
      );
    }

    const parsed = parseInput(input.trim());
    const displayTitle = extractTitle(input.trim(), parsed);

    // 如果解析出了链接，尝试用 fetch-url 提取标题和图片
    let fetchedTitle = '';
    let fetchedImageUrl = '';

    if (parsed.taobaoUrl && parsed.sourceType !== 'manual' && cozeFetchAvailable) {
      try {
        const { FetchClient, Config, HeaderUtils } = require('coze-coding-dev-sdk');
        const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
        const config = new Config();
        const client = new FetchClient(config, customHeaders);
        const response = await client.fetch(parsed.taobaoUrl);

        if (response.status_code === 0 && response.title) {
          fetchedTitle = response.title;
        }

        // 提取第一张图片
        if (response.status_code === 0 && response.content) {
          const firstImage = response.content.find(
            (item: { type: string; image?: { display_url?: string; thumbnail_display_url?: string } }) =>
              item.type === 'image' && item.image?.display_url
          );
          if (firstImage && firstImage.image?.thumbnail_display_url) {
            fetchedImageUrl = firstImage.image.thumbnail_display_url;
          } else if (firstImage && firstImage.image?.display_url) {
            fetchedImageUrl = firstImage.image.display_url;
          }
        }
      } catch {
        // fetch-url 提取失败不影响主流程，使用本地解析结果
      }
    }

    return NextResponse.json({
      success: true,
      parsed: {
        ...parsed,
        title: fetchedTitle || displayTitle,
        imageUrl: fetchedImageUrl || parsed.imageUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { error: '解析失败' },
      { status: 400 }
    );
  }
}
