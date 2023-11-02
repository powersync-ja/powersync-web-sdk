'use client';
import React from 'react';
import { usePowerSync } from '@journeyapps/powersync-react';
import { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/ParentProvider';
import { Grid, styled } from '@mui/material';

export type LoginFormParams = {
  email: string;
  password: string;
};

export default function Login() {
  return (
    <S.MainGrid container>
      <Grid item xs={12} md={6} lg={5}>
        <div>loading</div>
      </Grid>
    </S.MainGrid>
  );
}

namespace S {
  export const MainGrid = styled(Grid)`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  `;
}
