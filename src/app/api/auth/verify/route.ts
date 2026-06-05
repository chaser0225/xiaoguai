import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = 
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}