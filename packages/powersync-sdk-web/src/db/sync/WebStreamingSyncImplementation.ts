import { AbstractStreamingSyncImplementation, LockOptions } from '@journeyapps/powersync-sdk-common';

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(lockOptions.type, lockOptions.callback);
  }
}
