'use client';
import React from 'react';
import { CircularProgress, Grid, styled } from '@mui/material';

export type LoginFormParams = {
  email: string;
  password: string;
};

/**
 * This page shows a loading spinner until the _layout.tsx
 * file detects a session and redirects either to the app or
 * auth flow.
 */
export default function EntryPage() {
  return (
    <S.MainGrid container>
      <S.CenteredGrid item xs={12} md={6} lg={5}>
        <CircularProgress />
      </S.CenteredGrid>
    </S.MainGrid>
  );
}

namespace S {
  export const CenteredGrid = styled(Grid)`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  export const MainGrid = styled(CenteredGrid)`
    min-height: 100vh;
  `;
}
