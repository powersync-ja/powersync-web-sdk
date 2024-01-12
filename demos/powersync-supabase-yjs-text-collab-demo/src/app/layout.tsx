'use client';

import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  styled
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import WifiIcon from '@mui/icons-material/Wifi';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import TerminalIcon from '@mui/icons-material/Terminal';

import { usePowerSync } from '@journeyapps/powersync-react';
import { useSupabase } from '@/components/providers/SystemProvider';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

import { ThemeProviderContainer } from '@/components/providers/ThemeProviderContainer';
import { DynamicSystemProvider } from '@/components/providers/DynamicSystemProvider';

import './globals.scss';

import { Lato } from 'next/font/google';

const font = Lato({ subsets: ['latin'], display: 'swap', weight: '400' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>PowerSync Yjs CRDT Text Collaboration Demo</title>
      </head>
      <body className={font.className}>
        <CssBaseline />
        <ThemeProviderContainer>
          <DynamicSystemProvider>{children}</DynamicSystemProvider>
        </ThemeProviderContainer>
      </body>
    </html>
  );
}
