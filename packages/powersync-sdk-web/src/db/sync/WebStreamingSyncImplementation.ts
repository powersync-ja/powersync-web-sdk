import _ from 'lodash';
import {
  AbstractStreamingSyncImplementation,
  AbstractStreamingSyncImplementationOptions,
  LockOptions,
  LockType
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
    lockOptions.type == LockType.SYNC && console.debug('requesting lock for ', identifier);
    return navigator.locks.request(identifier, { signal: lockOptions.signal }, async () => {
      return new Promise((resolve, reject) => {
        // TODO, the fetch and ndjson streams don't work well with being aborted via a signal
        // Currently there is a "DOMException: BodyStreamBuffer was aborted" error that is
        // thrown when the signal is aborted, but this error does not seem to be catchable
        lockOptions.signal?.addEventListener('abort', () => {
          reject(new Error('Abort signal received'));
        });

        lockOptions.callback().then(resolve).catch(reject);
      });
    });
  }
}
