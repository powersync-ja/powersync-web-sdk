import _ from 'lodash';
import { AbstractStreamingSyncImplementation, LockOptions } from '@journeyapps/powersync-sdk-common';

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(lockOptions.type, async () => {
      try {
        await lockOptions.callback();
      } catch (ex) {
        console.error('caught exception in lock context', ex);
        throw ex;
      }
    });
  }
}
