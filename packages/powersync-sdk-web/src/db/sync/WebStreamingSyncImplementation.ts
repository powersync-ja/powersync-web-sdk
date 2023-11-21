import _ from 'lodash';
import {
  AbstractStreamingSyncImplementation,
  AbstractStreamingSyncImplementationOptions,
  LockOptions
} from '@journeyapps/powersync-sdk-common';

export type StateUpdatePayload = {
  connected: boolean;
  lastSyncedAt?: string;
};

const CONNECTED_STORAGE_KEY = 'powersync-connected';
const LAST_SYNCED_KEY = 'powersync-last-synced';

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  constructor(options: AbstractStreamingSyncImplementationOptions) {
    super(options);

    // TODO clean this up better
    const isConnected = Boolean(localStorage.getItem(CONNECTED_STORAGE_KEY));
    const lastSyncedString = localStorage.getItem(LAST_SYNCED_KEY);
    const lastSyncedAt = lastSyncedString ? new Date(lastSyncedString) : undefined;
    _.defer(() => this.updateSyncStatus(isConnected, lastSyncedAt));

    window.addEventListener('storage', (event) => {
      switch (event.key) {
        case CONNECTED_STORAGE_KEY:
          this.updateSyncStatus(Boolean(event.newValue));
          break;
        case LAST_SYNCED_KEY:
          this.updateSyncStatus(this.isConnected, new Date(event.newValue!));
          break;
      }
    });
  }

  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(lockOptions.type, async () => {
      try {
        await lockOptions.callback();
      } catch (ex) {
        console.error('caught exception in lock context', ex);
      }
    });
  }

  protected updateSyncStatus(connected: boolean, lastSyncedAt?: Date | undefined): void {
    super.updateSyncStatus(connected, lastSyncedAt);
    // persist to local storage to share between tabs
    localStorage.setItem(CONNECTED_STORAGE_KEY, connected.toString());
    if (lastSyncedAt) {
      localStorage.setItem(LAST_SYNCED_KEY, lastSyncedAt.toISOString());
    }
  }
}
