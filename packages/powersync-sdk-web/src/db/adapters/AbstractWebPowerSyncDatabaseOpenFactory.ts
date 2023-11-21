import {
  AbstractPowerSyncDatabase,
  AbstractPowerSyncDatabaseOpenFactory,
  PowerSyncDatabaseOptions,
  PowerSyncOpenFactoryOptions
} from '@journeyapps/powersync-sdk-common';
import { PowerSyncDatabase } from '../../db/PowerSyncDatabase';
import { SSRDBAdapter } from './SSRDBAdapter';

export interface WebPowerSyncOpenFactoryOptions extends PowerSyncOpenFactoryOptions {
  disableSSRWarning?: boolean;
}

/**
 * Intermediate PowerSync Database Open factory for Web which uses a mock
 * SSR DB Adapter if running on server side.
 * Most SQLite DB implementations only run on client side, this will safely return
 * empty query results in SSR which will allow for generating server partial views.
 */
export abstract class AbstractWebPowerSyncDatabaseOpenFactory extends AbstractPowerSyncDatabaseOpenFactory {
  protected isServerSide() {
    return typeof window == 'undefined';
  }

  constructor(protected options: WebPowerSyncOpenFactoryOptions) {
    super(options);
  }

  generateOptions(): PowerSyncDatabaseOptions {
    const isServerSide = this.isServerSide();
    if (isServerSide && !this.options.disableSSRWarning) {
      console.warn(
        `
  Running PowerSync in SSR mode.
  Only empty query results will be returned.
  Disable this warning by setting 'disableSSRWarning: true' in options.`
      );
    }

    return {
      database: isServerSide ? new SSRDBAdapter() : this.openDB(),
      schema: this.schema
    };
  }

  generateInstance(options: PowerSyncDatabaseOptions): AbstractPowerSyncDatabase {
    return new PowerSyncDatabase(options);
  }
}
