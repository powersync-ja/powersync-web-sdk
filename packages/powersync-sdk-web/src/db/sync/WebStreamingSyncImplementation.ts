import _ from 'lodash';
import {
  AbstractStreamingSyncImplementation,
  AbstractStreamingSyncImplementationOptions,
  LockOptions
} from '@journeyapps/powersync-sdk-common';

export interface WebStreamingSyncImplementationOptions {
  /**
   * An identifier for which PowerSync DB this sync implementation is
   * linked to. Most commonly DB name, but not restricted to DB name.
   */
  workerIdentifier: string;
}

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  constructor(
    options: AbstractStreamingSyncImplementationOptions,
    protected options2: WebStreamingSyncImplementationOptions
  ) {
    super(options);
  }

  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(`streaming-sync-${lockOptions.type}-${this.options2.workerIdentifier}`, async () => {
      try {
        await lockOptions.callback();
      } catch (ex) {
        console.error('caught exception in lock context', ex);
        throw ex;
      }
    });
  }
}
