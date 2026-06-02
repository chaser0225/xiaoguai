import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '共享购物清单 - 一起帮朋友加购',
  description:
    '输入密码加入共享购物清单，粘贴淘口令或淘宝链接添加商品，一起帮朋友加购',
  keywords: ['共享购物', '淘宝加购', '淘口令', '购物清单', '协作购物'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
