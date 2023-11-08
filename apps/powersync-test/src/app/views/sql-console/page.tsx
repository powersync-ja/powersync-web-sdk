'use client';
import _ from 'lodash';
import React from 'react';
import { usePowerSyncWatchedQuery } from '@journeyapps/powersync-react';
import { Box, TextField, styled } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { NavigationPage } from '@/components/navigation/NavigationPage';

export type LoginFormParams = {
  email: string;
  password: string;
};

const DEFAULT_QUERY = 'SELECT * FROM lists';

export default () => {
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
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
    <NavigationPage title="SQL Console">
      <S.MainContainer>
        <TextField
          fullWidth
          label="Query"
          defaultValue={DEFAULT_QUERY}
          onChange={(event) => debouncedSetQuery(event.target.value)}
        />

        {queryDataGridResult ? (
          <S.QueryResultContainer>
            {queryDataGridResult.columns ? (
              <DataGrid
                autoHeight={true}
                rows={queryDataGridResult.rows?.map((r, index) => ({ ...r, id: r.id ?? index })) ?? []}
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
      </S.MainContainer>
    </NavigationPage>
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
