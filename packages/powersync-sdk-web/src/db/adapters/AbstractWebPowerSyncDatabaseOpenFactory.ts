import _ from 'lodash';
import {
  AbstractPowerSyncDatabase,
  AbstractPowerSyncDatabaseOpenFactory,
  PowerSyncDatabaseOptions,
  PowerSyncOpenFactoryOptions
} from '@journeyapps/powersync-sdk-common';
import { PowerSyncDatabase, WebPowerSyncDatabaseOptions } from '../../db/PowerSyncDatabase';
import { SSRDBAdapter } from './SSRDBAdapter';

export type WebPowerSyncFlags = {
  enableMultiTabs?: boolean;
  disableSSRWarning?: boolean;
};

export interface WebPowerSyncOpenFactoryOptions extends PowerSyncOpenFactoryOptions {
  flags?: WebPowerSyncFlags;
}

export const DEFAULT_POWERSYNC_FLAGS: WebPowerSyncFlags = {
  /**
   * Multiple tabs are by default not supported on Android, iOS and Safari.
   * Other platforms will have multiple tabs enabled by default.
   */
  enableMultiTabs:
    typeof globalThis.navigator !== 'undefined' && // For SSR purposes
    !navigator.userAgent.match(/(Android|iPhone|iPod|iPad)/i) &&
    !(window as any).safari
};

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

  generateOptions(): WebPowerSyncDatabaseOptions {
    const isServerSide = this.isServerSide();
    if (isServerSide && !this.options.flags?.disableSSRWarning) {
      console.warn(
        `
  Running PowerSync in SSR mode.
  Only empty query results will be returned.
  Disable this warning by setting 'disableSSRWarning: true' in options.`
      );
    }

    const resolvedFlags = this.resolveFlags();

    if (!resolvedFlags.enableMultiTabs) {
      console.warn(
        'Multiple tab support is not enabled. Using this site across multiple tabs may not function correctly.'
      );
    }

    return {
      database: isServerSide ? new SSRDBAdapter() : this.openDB(),
      schema: this.schema,
      flags: resolvedFlags
    };
  }

  protected resolveFlags() {
    return _.merge(DEFAULT_POWERSYNC_FLAGS, {
      ...DEFAULT_POWERSYNC_FLAGS,
      ssrMode: this.isServerSide(),
      enableMultiTabs: this.options.flags?.enableMultiTabs
    });
  }

  generateInstance(options: PowerSyncDatabaseOptions): AbstractPowerSyncDatabase {
    return new PowerSyncDatabase(options);
  }
}
