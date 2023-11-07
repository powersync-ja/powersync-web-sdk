import {
  BaseObserver,
  DBAdapter,
  DBAdapterListener,
  DBGetUtils,
  DBLockOptions,
  LockContext,
  PowerSyncOpenFactoryOptions,
  QueryResult,
  Transaction
} from '@journeyapps/powersync-sdk-common';
import _ from 'lodash';
//@ts-ignore
import * as SQLite from 'wa-sqlite/src/sqlite-api.js';
import 'wa-sqlite/src/types';

export type WASQLiteResults = {
  columns: string[];
  rows: SQLiteCompatibleType[][];
};

export type WASQLITE_TAG = (
  sql: string | TemplateStringsArray,
  ...values: string[] | SQLiteCompatibleType[][][]
) => Promise<WASQLiteResults[]>;

/**
 * Adapter for WA-SQLite
 */
export class WASQLiteDBAdapter extends BaseObserver<DBAdapterListener> implements DBAdapter {
  private initialized: Promise<void>;
  private _sqlite3: SQLiteAPI | null;
  private db: number | null;

  getAll: <T>(sql: string, parameters?: any[]) => Promise<T[]>;
  getOptional: <T>(sql: string, parameters?: any[]) => Promise<T | null>;
  get: <T>(sql: string, parameters?: any[]) => Promise<T>;

  constructor(protected options: PowerSyncOpenFactoryOptions) {
    super();
    this._sqlite3 = null;
    this.db = null;
    this.initialized = this.init();

    const topLevelUtils = this.generateDBHelpers({ execute: this._execute });
    this.getAll = topLevelUtils.getAll;
    this.getOptional = topLevelUtils.getOptional;
    this.get = topLevelUtils.get;
  }

  private get sqlite3() {
    if (!this._sqlite3) {
      throw new Error(`SQLite is not initialized yet.`);
    }
    return this._sqlite3;
  }

  readLock<T>(fn: (tx: LockContext) => Promise<T>, options?: DBLockOptions | undefined): Promise<T> {
    return new Promise((resolve, reject) => {
      navigator.locks.request('TODODBLock', async () => {
        try {
          const res = await fn(this.generateDBHelpers({ execute: this._execute }));
          resolve(res);
        } catch (ex) {
          reject(ex);
        }
      });
    });
  }

  writeLock<T>(fn: (tx: LockContext) => Promise<T>, options?: DBLockOptions | undefined): Promise<T> {
    return new Promise((resolve, reject) => {
      navigator.locks.request('TODODBLock', async () => {
        try {
          const res = await fn(this.generateDBHelpers({ execute: this._execute }));
          resolve(res);
        } catch (ex) {
          reject(ex);
        }
      });
    });
  }

  async readTransaction<T>(fn: (tx: Transaction) => Promise<T>, options?: DBLockOptions | undefined): Promise<T> {
    return this.readLock(this.wrapTransaction(fn));
  }

  writeTransaction<T>(fn: (tx: Transaction) => Promise<T>, options?: DBLockOptions | undefined): Promise<T> {
    return this.writeLock(this.wrapTransaction(fn));
  }

  async init() {
    // TODO setup Webworker
    const { default: moduleFactory } = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
    const module = await moduleFactory();
    this._sqlite3 = SQLite.Factory(module);

    // // TODO
    // @ts-ignore
    const { IDBMinimalVFS } = await import('wa-sqlite/src/examples/IDBMinimalVFS.js');
    const vfs = new IDBMinimalVFS(this.options.dbFilename);
    // @ts-ignore
    this.sqlite3.vfs_register(vfs, true);

    this.db = await this.sqlite3.open_v2(this.options.dbFilename);
    this.sqlite3.register_table_onchange_hook(this.db, (opType, tableName, rowId) => {
      this.iterateListeners((cb) => cb.tablesUpdated?.({ opType, table: tableName, rowId }));
    });
  }

  async execute(query: string, params?: any[] | undefined): Promise<QueryResult> {
    return this.writeLock((ctx) => ctx.execute(query, params));
  }

  close() {
    this.sqlite3.close(this.db);
  }

  /**
   * Wraps a lock context into a transaction context
   */
  private wrapTransaction<T>(cb: (tx: Transaction) => Promise<T>) {
    return async (tx: LockContext): Promise<T> => {
      await this._execute('BEGIN TRANSACTION');
      let finalized = false;
      const commit = async (): Promise<QueryResult> => {
        if (finalized) {
          return { rowsAffected: 0 };
        }
        finalized = true;
        return this._execute('COMMIT');
      };

      const rollback = () => {
        finalized = true;
        return this._execute('ROLLBACK');
      };

      try {
        const result = await cb({
          ...tx,
          commit,
          rollback
        });

        if (!finalized) {
          await commit();
        }
        return result;
      } catch (ex) {
        console.debug('caught ex in transaction', ex);
        await rollback();
        throw ex;
      }
    };
  }

  /**
   * This executes SQL statements.
   * Note that this should be guarded with a lock to ensure only 1 query is executed concurrently.
   */
  private _execute = async (sql: string | TemplateStringsArray, bindings?: any[]): Promise<QueryResult> => {
    await this.initialized;
    return navigator.locks.request('DBExecute', async () => {
      const results = [];
      for await (const stmt of this.sqlite3.statements(this.db!, sql as string)) {
        let columns;
        const wrappedBindings = bindings ? [bindings] : [[]];
        for (const binding of wrappedBindings) {
          this.sqlite3.reset(stmt);
          if (bindings) {
            this.sqlite3.bind_collection(stmt, binding);
          }

          const rows = [];
          while ((await this.sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
            const row = this.sqlite3.row(stmt);
            rows.push(row);
          }

          columns = columns ?? this.sqlite3.column_names(stmt);
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
        insertId: this.sqlite3.last_insert_id(this.db),
        rowsAffected: this.sqlite3.changes(this.db),
        rows: {
          _array: rows,
          item: (index: number) => rows[index],
          length: rows.length
        }
      };

      console.debug(sql, bindings, JSON.stringify(result));
      return result;
    });
  };

  private generateDBHelpers<T extends { execute: (sql: string, params?: any[]) => Promise<QueryResult> }>(
    tx: T
  ): T & DBGetUtils {
    return {
      ...tx,
      /**
       *  Execute a read-only query and return results
       */
      async getAll<T>(sql: string, parameters?: any[]): Promise<T[]> {
        const res = await tx.execute(sql, parameters);
        return res.rows?._array ?? [];
      },

      /**
       * Execute a read-only query and return the first result, or null if the ResultSet is empty.
       */
      async getOptional<T>(sql: string, parameters?: any[]): Promise<T | null> {
        const res = await tx.execute(sql, parameters);
        return res.rows?.item(0) ?? null;
      },

      /**
       * Execute a read-only query and return the first result, error if the ResultSet is empty.
       */
      async get<T>(sql: string, parameters?: any[]): Promise<T> {
        const res = await tx.execute(sql, parameters);
        const first = res.rows?.item(0);
        if (!first) {
          throw new Error('Result set is empty');
        }
        return first;
      }
    };
  }
}

/**
 * For testing DB state when using IndexDB VFS
 * This will allow downloading the DB file
 */
// @ts-ignore
window._snapshotDB = (dbName: string) => {
  const request = window.indexedDB.open(dbName, 3);

  request.onsuccess = (event: any) => {
    var db = event.target?.result;

    // Now you can query the object store to get all items.
    var transaction = db.transaction('blocks', 'readonly');
    var objectStore = transaction.objectStore('blocks');
    var getAllItemsRequest = objectStore.getAll();

    getAllItemsRequest.onsuccess = function (event: any) {
      // const blocks: Uint8Array[] = getAllItemsRequest.result.map((d: any) => d.data);

      const length = -1 * Number(getAllItemsRequest.result[0].offset) + 4096;
      const mergedArray = new Uint8Array(length);
      getAllItemsRequest.result.forEach((item: any) => {
        mergedArray.set(item.data, -1 * Number(item.offset));
      });

      // Save to file
      var blob = new Blob([mergedArray], { type: 'application/octet-stream' });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = 'test.db'; // Set the desired file name and extension
      a.click();

      URL.revokeObjectURL(url);
    };

    transaction.oncomplete = function () {
      // Transaction completed.
      db.close();
    };
  };
};
