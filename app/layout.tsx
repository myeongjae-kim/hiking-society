import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hiking Society',
  description: 'A WebTUI teaser for Hiking Society',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-webtui-theme="catppuccin-mocha" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
