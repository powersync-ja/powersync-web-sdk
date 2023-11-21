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
import * as Comlink from 'comlink';
import Logger, { ILogger } from 'js-logger';
import type { OpenDB, WASQLiteExecuteMethod } from '../../../worker/SharedWASQLiteDB';

/**
 * Adapter for WA-SQLite
 */
export class WASQLiteDBAdapter extends BaseObserver<DBAdapterListener> implements DBAdapter {
  private initialized: Promise<void>;
  private logger: ILogger;
  private dbGetHelpers: DBGetUtils | null;
  private _workerExecute: WASQLiteExecuteMethod | null;

  constructor(protected options: Omit<PowerSyncOpenFactoryOptions, 'schema'>) {
    super();
    this.logger = Logger.get('WASQLite');
    this.dbGetHelpers = null;
    this._workerExecute = null;
    this.initialized = this.init();
    this.dbGetHelpers = this.generateDBHelpers({ execute: this._execute.bind(this) });
  }

  protected async init() {
    const worker = new SharedWorker(new URL('../../../worker/SharedWASQLiteDB.worker.js', import.meta.url));
    const openDB = Comlink.wrap<OpenDB>(worker.port);

    const { execute, registerOnTableChange } = await openDB(this.options.dbFilename);
    this._workerExecute = execute;

    registerOnTableChange(
      Comlink.proxy((opType, tableName, rowId) => {
        this.iterateListeners((cb) => cb.tablesUpdated?.({ opType, table: tableName, rowId }));
      })
    );
  }

  async execute(query: string, params?: any[] | undefined): Promise<QueryResult> {
    return this.writeLock((ctx) => ctx.execute(query, params));
  }

  /**
   * Wraps the worker execute function, awaiting for it to be available
   */
  private _execute = async (sql: string, bindings?: any[]): Promise<QueryResult> => {
    await this.initialized;
    const result = await this._workerExecute!(sql, bindings);
    return {
      ...result,
      rows: {
        ...result.rows,
        item: (idx: number) => result.rows._array[idx]
      }
    };
  };

  close() {
    /**
     * TODO improve DB closing logic in shared worker.
     * Cannot close a DB from a single browser tab, as multiple may be using
     * the same connection.
     * The shared worker will close connections once it closes
     * */
  }

  async getAll<T>(sql: string, parameters?: any[] | undefined): Promise<T[]> {
    await this.initialized;
    return this.dbGetHelpers!.getAll(sql, parameters);
  }

  async getOptional<T>(sql: string, parameters?: any[] | undefined): Promise<T | null> {
    await this.initialized;
    return this.dbGetHelpers!.getOptional(sql, parameters);
  }

  async get<T>(sql: string, parameters?: any[] | undefined): Promise<T> {
    await this.initialized;
    return this.dbGetHelpers!.get(sql, parameters);
  }

  async readLock<T>(fn: (tx: LockContext) => Promise<T>, options?: DBLockOptions | undefined): Promise<T> {
    await this.initialized;
    return new Promise((resolve, reject) => {
      // This implementation currently only uses a single connection. Locking is ensured by navigator locks
      // TODO add concurrent connections
      navigator.locks.request('DBLock', async () => {
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
      // This implementation currently only uses a single connection. Locking is ensured by navigator locks
      // TODO add concurrent connections
      navigator.locks.request('DBLock', async () => {
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
        this.logger.debug('Caught ex in transaction', ex);
        await rollback();
        throw ex;
      }
    };
  }

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
