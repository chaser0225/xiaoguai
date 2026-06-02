import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getItem, updateItemStatus, deleteItem } from '@/lib/store';

// 更新商品状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { error: '未授权，请先登录' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body as { status: 'pending' | 'purchased' | 'removed' };

    if (!status || !['pending', 'purchased', 'removed'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    const item = await updateItemStatus(id, status);
    if (!item) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json(
      { error: '更新失败' },
      { status: 400 }
    );
  }
}

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { error: '未授权，请先登录' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const deleted = await deleteItem(id);
  if (!deleted) {
    return NextResponse.json(
      { error: '商品不存在' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
