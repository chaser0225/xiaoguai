'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (newPassword.length < 4) {
      setError('新密码至少需要4个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '修改失败');
        return;
      }

      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-600"
        >
          <KeyRound className="w-4 h-4 mr-1.5" />
          改密码
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-500" />
            修改密码
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-600 font-medium">密码修改成功</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 旧密码 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                当前密码
              </label>
              <div className="relative">
                <Input
                  type={showOld ? 'text' : 'password'}
                  placeholder="输入当前密码"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setError('');
                  }}
                  className="pr-10 rounded-xl"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                新密码
              </label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="输入新密码（至少4位）"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  className="pr-10 rounded-xl"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                确认新密码
              </label>
              <Input
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="rounded-xl"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              disabled={loading}
            >
              {loading ? '修改中...' : '确认修改'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
