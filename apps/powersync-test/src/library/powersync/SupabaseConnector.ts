import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType
} from '@journeyapps/powersync-sdk-web';

import { SupabaseClient, createClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
};

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception
  // Examples include data type mismatch.
  new RegExp('^22...$'),
  // Class 23 — Integrity Constraint Violation.
  // Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
  new RegExp('^23...$'),
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  new RegExp('^42501$')
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  private _supabaseClient: SupabaseClient | null;
  private _config: SupabaseConfig | null;

  constructor() {
    this._supabaseClient = null;
    this._config = null;
  }

  get supabaseClient(): SupabaseClient {
    if (!this._supabaseClient) {
      throw new Error('Supabase client has not been initialized yet');
    }
    return this._supabaseClient;
  }

  get config(): SupabaseConfig {
    if (!this._config) {
      throw new Error('Supabase client has not been initialized yet');
    }
    return this._config;
  }

  async init() {
    const credentialsResponse = await fetch('/api/supabase');
    // Handle errors here
    const credentials: SupabaseConfig = await credentialsResponse.json();
    this._supabaseClient = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey, {
      auth: {
        persistSession: true
      }
    });
  }

  async login(username: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error) {
      throw error;
    }
  }

  async fetchCredentials() {
    const {
      data: { session },
      error
    } = await this.supabaseClient.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    console.debug('session expires at', session.expires_at);

    return {
      client: this.supabaseClient,
      endpoint: this.config.powersyncUrl,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
      userID: session.user.id
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (let op of transaction.crud) {
        lastOp = op;
        const table = this.supabaseClient.from(op.table);
        switch (op.op) {
          case UpdateType.PUT:
            const record = { ...op.opData, id: op.id };
            const { error } = await table.upsert(record);
            if (error) {
              throw new Error(`Could not upsert data to Supabase ${JSON.stringify(error)}`);
            }
            break;
          case UpdateType.PATCH:
            await table.update(op.opData).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            await table.delete().eq('id', op.id);
            break;
        }
      }

      await transaction.complete();
    } catch (ex: any) {
      console.debug(ex);
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error(`Data upload error - discarding ${lastOp}`, ex);
        await transaction.complete();
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        throw ex;
      }
    }
  }
}
