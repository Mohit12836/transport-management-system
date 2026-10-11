import type { Metadata } from 'next';
import './globals.css';
import { DemoProvider } from '../lib/demo-context';

export const metadata: Metadata = {
  title: 'NextGen Transport Management System | TMS Pro',
  description: 'Enterprise Transport Management System with 1-Click LR Generation, 3-Copy Print, Live Dispatch, and Multi-Role Portals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-red-500 selection:text-white">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
