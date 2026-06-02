import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, changePassword } from '@/lib/auth';

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
    const { oldPassword, newPassword } = body as {
      oldPassword: string;
      newPassword: string;
    };

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请输入旧密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: '新密码至少需要4个字符' },
        { status: 400 }
      );
    }

    const success = changePassword(oldPassword, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: '旧密码错误' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: '请求格式错误' },
      { status: 400 }
    );
  }
}
