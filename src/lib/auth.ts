import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xiaoguai-default-secret-change-me';

// 生成 JWT token（任何实例都能验证，不依赖内存）
export function generateToken(): string {
  const token = jwt.sign(
    { role: 'admin', createdAt: Date.now() },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
}

// 验证 JWT token（无状态，任何服务器实例都能验证）
export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// 验证密码（从数据库读取，不再用内存变量）
import { getSupabaseClient } from '@/storage/database/supabase-client';

async function getPasswordFromDB(): Promise<string> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (error || !data) {
      console.error('读取密码失败:', error);
      return process.env.ADMIN_PASSWORD || 'taobao2024';
    }
    return data.value;
  } catch (err) {
    console.error('读取密码异常:', err);
    return process.env.ADMIN_PASSWORD || 'taobao2024';
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const currentPassword = await getPasswordFromDB();
  return password === currentPassword;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  const currentPassword = await getPasswordFromDB();
  if (oldPassword !== currentPassword) return false;
  if (!newPassword || newPassword.length < 4) return false;

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('app_settings')
      .update({ value: newPassword, updated_at: new Date().toISOString() })
      .eq('key', 'admin_password');

    if (error) {
      console.error('更新密码失败:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('更新密码异常:', err);
    return false;
  }
}