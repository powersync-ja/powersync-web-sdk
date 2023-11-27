import _ from 'lodash';
import {
  AbstractStreamingSyncImplementation,
  AbstractStreamingSyncImplementationOptions,
  LockOptions
} from '@journeyapps/powersync-sdk-common';

export interface WebStreamingSyncImplementationOptions extends AbstractStreamingSyncImplementationOptions {
  /**
   * An identifier for which PowerSync DB this sync implementation is
   * linked to. Most commonly DB name, but not restricted to DB name.
   */
  workerIdentifier: string;
}

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  constructor(options: WebStreamingSyncImplementationOptions) {
    // Super will store and provide default values for options
    super(options);
  }

  get webOptions(): WebStreamingSyncImplementationOptions {
    return this.options as WebStreamingSyncImplementationOptions;
  }

  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(
      `streaming-sync-${lockOptions.type}-${this.webOptions.workerIdentifier}`,
      async () => {
        try {
          await lockOptions.callback();
        } catch (ex) {
          console.error('caught exception in lock context', ex);
          throw ex;
        }
      }
    );
  }
}
