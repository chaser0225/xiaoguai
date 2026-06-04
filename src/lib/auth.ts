import { getSupabaseClient } from '@/storage/database/supabase-client';

// 使用全局变量存储 session（token 存内存，重启会失效，但先解决密码问题）
const globalForSessions = globalThis as unknown as {
  __shoppingSessions: Set<string> | undefined;
};

if (!globalForSessions.__shoppingSessions) {
  globalForSessions.__shoppingSessions = new Set<string>();
}

const sessions = globalForSessions.__shoppingSessions;

// 生成 session token
export function generateToken(): string {
  const token =
    Date.now().toString(36) +
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);
  sessions.add(token);
  return token;
}

// 从数据库读取密码
async function getPasswordFromDB(): Promise<string> {
  try {
    const client = getSupabaseClient(); // 使用 service_role key
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

// 验证密码（改为异步，从数据库读取）
export async function verifyPassword(password: string): Promise<boolean> {
  const currentPassword = await getPasswordFromDB();
  return password === currentPassword;
}

// 修改密码（改为异步，写入数据库）
export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  const currentPassword = await getPasswordFromDB();
  if (oldPassword !== currentPassword) return false;
  if (!newPassword || newPassword.length < 4) return false;

  try {
    const client = getSupabaseClient(); // 使用 service_role key
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

// 验证 token
export function verifyToken(token: string): boolean {
  return sessions.has(token);
}

// 销毁 token
export function destroyToken(token: string): void {
  sessions.delete(token);
}