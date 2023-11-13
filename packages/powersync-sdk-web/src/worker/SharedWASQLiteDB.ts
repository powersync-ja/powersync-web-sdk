//@ts-ignore TODO add types to package
import * as SQLite from '@journeyapps/wa-sqlite/src/sqlite-api.js';
import '@journeyapps/wa-sqlite';

import _ from 'lodash';
import * as Comlink from 'comlink';
import { QueryResult } from '@journeyapps/powersync-sdk-common';
import { v4 as uuid } from 'uuid';

// The item function cannot be returned over Comlink bridge
export type WASQLExecuteResult = Omit<QueryResult, 'rows'> & {
  rows: {
    _array: any[];
    length: number;
  };
};

export type WASQLiteExecuteMethod = (sql: string, params?: any[]) => Promise<WASQLExecuteResult>;
export type OnTableChangeCallback = (opType: number, tableName: string, rowId: number) => void;
export type OpenDB = (dbFileName: string) => Promise<DBWorkerInterface>;

export type DBWorkerInterface = {
  execute: WASQLiteExecuteMethod;
  registerOnTableChange: (callback: OnTableChangeCallback) => void;
};

export type InternalDBWorkerInterface = DBWorkerInterface & {
  close: () => void;
};

const _self: SharedWorkerGlobalScope = self as any;

async function _openDB(dbFileName: string): Promise<InternalDBWorkerInterface> {
  // @ts-ignore TODO better typings
  const { default: moduleFactory } = await import('@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs');
  const module = await moduleFactory();
  const sqlite3 = SQLite.Factory(module);

  // @ts-ignore
  const { IDBBatchAtomicVFS } = await import('@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js');
  const vfs = new IDBBatchAtomicVFS(dbFileName);
  sqlite3.vfs_register(vfs, true);

  const db = await sqlite3.open_v2(dbFileName);
  const listeners = new Map<string, OnTableChangeCallback>();

  sqlite3.register_table_onchange_hook(db, (opType: number, tableName: string, rowId: number) => {
    Array.from(listeners.values()).forEach((l) => l(opType, tableName, rowId));
  });

  const registerOnTableChange = (callback: OnTableChangeCallback) => {
    const id = uuid();
    listeners.set(id, callback);
    return Comlink.proxy(() => {
      listeners.delete(id);
    });
  };

  /**
   * This executes SQL statements.
   */
  const execute = async (sql: string | TemplateStringsArray, bindings?: any[]): Promise<WASQLExecuteResult> => {
    // Running multiple statements on the same connection concurrently should not be allowed
    return navigator.locks.request('DBExecute', async () => {
      const results = [];
      for await (const stmt of sqlite3.statements(db, sql as string)) {
        let columns;
        const wrappedBindings = bindings ? [bindings] : [[]];
        for (const binding of wrappedBindings) {
          // TODO not sure why this is needed currently, but booleans break
          binding.forEach((b, index, arr) => {
            if (typeof b == 'boolean') {
              arr[index] = b ? 1 : 0;
            }
          });

          sqlite3.reset(stmt);
          if (bindings) {
            sqlite3.bind_collection(stmt, binding);
          }

          const rows = [];
          while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(stmt);
            rows.push(row);
          }

          columns = columns ?? sqlite3.column_names(stmt);
          if (columns.length) {
            results.push({ columns, rows });
          }
        }

        // When binding parameters, only a single statement is executed.
        if (bindings) {
          break;
        }
      }

      const rows = _.chain(results)
        .filter(({ rows }) => !!rows.length)
        .flatMap(({ columns, rows }) =>
          _.map(rows, (row) =>
            _.reduce(
              columns,
              (out: Record<string, any>, key: string, index) => {
                out[key] = row[index];
                return out;
              },
              {}
            )
          )
        )
        .value();

      const result = {
        insertId: sqlite3.last_insert_id(db),
        rowsAffected: sqlite3.changes(db),
        rows: {
          _array: rows,
          length: rows.length
        }
      };

      return result;
    });
  };

  return {
    execute: Comlink.proxy(execute),
    registerOnTableChange: Comlink.proxy(registerOnTableChange),
    close: () => {
      sqlite3.close(db);
    }
  };
}

const DBMap = new Map<string, InternalDBWorkerInterface>();

const openDB = async (dbFileName: string): Promise<DBWorkerInterface> => {
  if (!DBMap.has(dbFileName)) {
    DBMap.set(dbFileName, await _openDB(dbFileName));
  }
  return Comlink.proxy(DBMap.get(dbFileName)!);
};

_self.onconnect = function (event: MessageEvent<string>) {
  const port = event.ports[0];

  console.debug('Exposing db on port', port);
  Comlink.expose(openDB, port);
};

addEventListener('beforeunload', (event) => {
  Array.from(DBMap.values()).forEach((db) => {
    db.close();
  });
});
