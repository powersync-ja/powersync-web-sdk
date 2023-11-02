'use client';
import _ from 'lodash';
import React from 'react';
import { usePowerSync, usePowerSyncWatchedQuery } from '@journeyapps/powersync-react';
import { AbstractPowerSyncDatabase, QueryResult } from '@journeyapps/powersync-sdk-web';
import { Box, Button, Grid, TextField, Typography, styled } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

export type LoginFormParams = {
  email: string;
  password: string;
};

type SQLQueryGridResult = {
  columns?: GridColDef[];
  insertId?: number;
  rows?: any[];
  rowsAffected?: number;
};

const DEFAULT_QUERY = 'SELECT * FROM lists';

export default function TodoLists() {
  const powerSync: AbstractPowerSyncDatabase = usePowerSync();
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [error, setError] = React.useState<string>('');

  const querySQLResult = usePowerSyncWatchedQuery(query);

  const queryResult = React.useMemo(() => {
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
      {queryResult ? (
        <S.QueryResultContainer>
          {queryResult.columns ? (
            <DataGrid
              autoHeight={true}
              rows={queryResult.rows ?? []}
              columns={queryResult.columns}
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
    </S.MainContainer>
  );
}

namespace S {
  export const MainContainer = styled(Box)`
    padding: 20px;
  `;

  export const QueryResultContainer = styled(Box)`
    margin-top: 40px;
  `;
}
