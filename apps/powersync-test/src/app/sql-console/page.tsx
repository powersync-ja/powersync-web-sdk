'use client';
import _ from 'lodash';
import React from 'react';
import { usePowerSync, usePowerSyncWatchedQuery } from '@journeyapps/powersync-react';
import { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';
import { Box, Button, TextField, Typography, styled } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DynamicParentProvider } from '@/components/DynamicParentProvider';

export type LoginFormParams = {
  email: string;
  password: string;
};

const DEFAULT_QUERY = 'SELECT * FROM lists';

export default () => {
  const powerSync: AbstractPowerSyncDatabase = usePowerSync();
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [error, setError] = React.useState<string>('');

  const querySQLResult = usePowerSyncWatchedQuery(query, [], { tables: ['lists'] });

  const queryDataGridResult = React.useMemo(() => {
    const firstItem = querySQLResult?.[0];

    return {
      columns: firstItem
        ? Object.keys(firstItem).map((field) => ({
            field,
            flex: 1
          }))
        : [],
      rows: querySQLResult
    };
  }, [querySQLResult]);

  const debouncedSetQuery = React.useCallback(
    _.debounce((query: string) => {
      setQuery(query);
    }, 500),
    []
  );

  return (
    <S.MainContainer>
      <TextField
        fullWidth
        label="Query"
        defaultValue={DEFAULT_QUERY}
        onChange={(event) => debouncedSetQuery(event.target.value)}
      />

      <Typography color="red">{error}</Typography>
      {queryDataGridResult ? (
        <S.QueryResultContainer>
          {queryDataGridResult.columns ? (
            <DataGrid
              autoHeight={true}
              rows={queryDataGridResult.rows ?? []}
              columns={queryDataGridResult.columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 20
                  }
                }
              }}
              pageSizeOptions={[20]}
              disableRowSelectionOnClick
            />
          ) : null}
        </S.QueryResultContainer>
      ) : null}

      <Button
        onClick={async (params) => {
          await powerSync.execute('DELETE FROM lists WHERE name=?', ['new one']);
        }}>
        Delete some things
      </Button>
      <Button
        onClick={async () => {
          try {
            await powerSync.execute(
              'INSERT INTO lists (id, created_at, name, owner_id) VALUES(uuid(), datetime(), ?, ?)',
              ['new one', '9a183452-9c55-4855-afa4-50e22142240d']
            );
          } catch (ex: any) {
            console.error(ex);
            setError(ex.message);
          }
        }}>
        Create a list
      </Button>
    </S.MainContainer>
  );
};

namespace S {
  export const MainContainer = styled(Box)`
    padding: 20px;
  `;

  export const QueryResultContainer = styled(Box)`
    margin-top: 40px;
  `;
}
