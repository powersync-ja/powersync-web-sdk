'use client';
import React from 'react';
import { ButtonGroup, Grid, Paper, TextField, Typography, styled } from '@mui/material';
import { useSupabase } from '@/components/ParentProvider';
import { useRouter } from 'next/navigation';
import { LoginDetailsWidget } from '@/components/LoginDetailsWidget';

export type RegisterFormParams = {
  email: string;
  password: string;
};

export default function Login() {
  const supabase = useSupabase();
  const router = useRouter();

  return (
    <S.MainGrid container>
      <Grid item xs={12} md={6} lg={5}>
        <LoginDetailsWidget
          title="Register for Supabase"
          submitTitle="Register"
          onSubmit={async ({ email, password }) => {
            if (!supabase) {
              throw new Error('Supabase has not been initialized yet');
            }
            const {
              data: { session },
              error
            } = await supabase.client.auth.signUp({ email, password });
            if (error) {
              throw new Error(error.message);
            }

            if (session) {
              supabase.iterateListeners((cb) => cb.sessionStarted?.(session));
              router.push('/todo-lists');
              return;
            }

            // TODO better dialog
            alert('Registration successful, please login');
            router.back();
          }}
          secondaryActions={[{ title: 'Back', onClick: () => router.back() }]}
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

  export const LoginContainer = styled(Paper)`
    padding: 20px;
    display: flex;
    flex-direction: column;
  `;

  export const LoginHeader = styled(Typography)`
    margin-bottom: 20px;
  `;

  export const ActionButtonGroup = styled(ButtonGroup)`
    margin-top: 20px;
    width: 100%;
    display: flex;
    justify-content: end;
  `;

  export const TextInput = styled(TextField)`
    margin-bottom: 20px;
  `;
}
