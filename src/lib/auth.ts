// 认证工具

// 当前密码（可动态修改），初始值来自环境变量
let currentPassword = process.env.ADMIN_PASSWORD || 'taobao2024';

// 使用全局变量存储 session，避免 Next.js dev 模式下模块热重载导致状态丢失
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

// 验证密码
export function verifyPassword(password: string): boolean {
  return password === currentPassword;
}

// 修改密码
export function changePassword(oldPassword: string, newPassword: string): boolean {
  if (oldPassword !== currentPassword) return false;
  if (!newPassword || newPassword.length < 4) return false;
  currentPassword = newPassword;
  return true;
}

// 验证 token
export function verifyToken(token: string): boolean {
  return sessions.has(token);
}

// 销毁 token
export function destroyToken(token: string): void {
  sessions.delete(token);
}
