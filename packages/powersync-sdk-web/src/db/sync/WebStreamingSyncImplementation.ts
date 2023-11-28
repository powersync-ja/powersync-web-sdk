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
    const identifier = `streaming-sync-${lockOptions.type}-${this.webOptions.workerIdentifier}`;
    this.logger.debug('requesting lock for ', identifier);
    return navigator.locks.request(identifier, { signal: lockOptions.signal }, async () => {
      this.logger.debug('obtained lock for', identifier);
      await lockOptions.callback();
    });
  }
}
