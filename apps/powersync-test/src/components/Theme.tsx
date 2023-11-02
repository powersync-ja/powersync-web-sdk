'use client';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { orange } from '@mui/material/colors';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

export const ThemeProviderWidget: React.FC<React.PropsWithChildren> = ({ children }) => {
  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: 'dark'
      }
    });
  }, []);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
