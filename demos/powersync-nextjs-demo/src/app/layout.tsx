import React from 'react';
import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import { ThemeProviderContainer } from '@/components/providers/ThemeProviderContainer';
import { DynamicParentProvider } from '@/components/providers/DynamicParentProvider';

const rubik = Rubik({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'PowerSync Demo',
  description: 'PowerSync Web SDK Demo'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={rubik.className}>
        <ThemeProviderContainer>
          <DynamicParentProvider>{children}</DynamicParentProvider>
        </ThemeProviderContainer>
      </body>
    </html>
  );
}
