import {
  BaseObserver,
  DBAdapter,
  DBAdapterListener,
  PowerSyncOpenFactoryOptions,
  QueryResult,
  Transaction
} from '@journeyapps/powersync-sdk-common';

//@ts-ignore
import * as SQLite from 'wa-sqlite/src/sqlite-api.js';
import 'wa-sqlite/src/types';

const WA_SQLITE = 'wa-sqlite/dist/wa-sqlite.mjs';

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

  constructor(protected options: PowerSyncOpenFactoryOptions) {
    super();
    // link table update commands
    this._sqlite3 = null;
    this.db = null;
    this.initialized = this.init();
  }

  private get sqlite3() {
    if (!this._sqlite3) {
      throw new Error(`SQLite is not initialized yet.`);
    }
    return this._sqlite3;
  }

  async init() {
    // TODO setup Webworker
    const { default: moduleFactory } = await import(WA_SQLITE);
    const module = await moduleFactory();
    this._sqlite3 = SQLite.Factory(module);

    // TODO VFS
    this.db = await this.sqlite3!.open_v2(this.options.dbFilename);
  }

  async transaction(fn: (tx: Transaction) => void | Promise<void>) {
    await this.initialized;
  }

  execute(query: string, params?: any[] | undefined): QueryResult {
    return {} as QueryResult;
  }

  async executeAsync(query: string, params?: any[] | undefined): Promise<QueryResult> {
    await this.initialized;
    const result = this._execute(query, params);
  }

  close() {
    // TODO
  }

  private async _execute(sql: string | TemplateStringsArray, bindings?: any[]) {
    const results = [];
    for await (const stmt of this.sqlite3!.statements(this.db!, sql as string)) {
      let columns;
      for (const binding of bindings ?? [[]]) {
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
        return results;
      }
    }
    return results;
  }

  private generateDBHelpers<T extends { executeAsync: (sql: string, params?: any[]) => Promise<QueryResult> }>(
    tx: T
  ): T {
    return {
      ...tx,
      /**
       *  Execute a read-only query and return results
       */
      async getAll<T>(sql: string, parameters?: any[]): Promise<T[]> {
        const res = await tx.executeAsync(sql, parameters);
        return res.rows?._array ?? [];
      },

      /**
       * Execute a read-only query and return the first result, or null if the ResultSet is empty.
       */
      async getOptional<T>(sql: string, parameters?: any[]): Promise<T | null> {
        const res = await tx.executeAsync(sql, parameters);
        return res.rows?.item(0) ?? null;
      },

      /**
       * Execute a read-only query and return the first result, error if the ResultSet is empty.
       */
      async get<T>(sql: string, parameters?: any[]): Promise<T> {
        const res = await tx.executeAsync(sql, parameters);
        const first = res.rows?.item(0);
        if (!first) {
          throw new Error('Result set is empty');
        }
        return first;
      }
    };
  }
}
