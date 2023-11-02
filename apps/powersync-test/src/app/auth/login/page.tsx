'use client';
import React from 'react';
import { Grid, styled } from '@mui/material';
import { useRouter } from 'next/navigation';
import { LoginDetailsWidget } from '@/components/LoginDetailsWidget';
import { useSupabase } from '@/components/ParentProvider';

export type LoginFormParams = {
  email: string;
  password: string;
};

export default function Login() {
  const router = useRouter();
  const supabase = useSupabase();

  return (
    <S.MainGrid container>
      <Grid item xs={12} md={6} lg={5}>
        <LoginDetailsWidget
          title="Login to Supabase"
          submitTitle="Login"
          onSubmit={async (values) => {
            if (!supabase) {
              throw new Error('Supabase has not been initialized yet');
            }
            await supabase.login(values.email, values.password);
          }}
          secondaryActions={[{ title: 'Register', onClick: () => router.push('/auth/register') }]}
        />
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
