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

const SYNC_STATUS_KEY = 'powersync-status';

export class WebStreamingSyncImplementation extends AbstractStreamingSyncImplementation {
  constructor(options: AbstractStreamingSyncImplementationOptions) {
    super(options);

    this.loadSerializedState(localStorage.getItem(SYNC_STATUS_KEY));
    window.addEventListener('storage', (event) => {
      const { key, newValue } = event;
      if (key == SYNC_STATUS_KEY && newValue) {
        this.loadSerializedState(newValue);
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
    localStorage.setItem(
      SYNC_STATUS_KEY,
      JSON.stringify({
        connected: this._isConnected,
        lastSyncedAt: this._lastSyncedAt
      })
    );
  }

  /**
   * Loads the shared sync status from a serialized string
   */
  protected loadSerializedState(state?: string | null) {
    if (!state) {
      return;
    }
    const { connected, lastSyncedAt } = JSON.parse(state) as StateUpdatePayload;
    _.defer(() => this.updateSyncStatus(connected, lastSyncedAt ? new Date(lastSyncedAt) : undefined));
  }
}
