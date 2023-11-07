import React from 'react';
import type { Metadata } from 'next';
import Head from 'next/head';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProviderWidget } from '@/components/Theme';
import { DynamicParentProvider } from '@/components/DynamicParentProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PowerSync Demo',
  description: 'PowerSync Web SDK Demo'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Rubik&display=optional" rel="stylesheet" />
      </Head>
      <body className={inter.className}>
        <ThemeProviderWidget>
          <DynamicParentProvider>{children}</DynamicParentProvider>
        </ThemeProviderWidget>
      </body>
    </html>
  );
}
