import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { AbstractStreamingSyncImplementationOptions, LockOptions } from '@journeyapps/powersync-sdk-common';
import * as Comlink from 'comlink';
import { WebStreamingSyncImplementation } from './WebStreamingSyncImplementation';
import {
  SharedSyncImplementation,
  SharedSyncMessage,
  SharedSyncMessageType,
  SharedSyncStatus
} from '../../worker/sync/SharedSyncImplementation';

export class SharedWebStreamingSyncImplementation extends WebStreamingSyncImplementation {
  protected stateManager: Comlink.Remote<SharedSyncImplementation>;
  protected syncTabId: string;

  constructor(options: AbstractStreamingSyncImplementationOptions) {
    super(options);

    this.syncTabId = uuid();
    const worker = new SharedWorker(new URL('../../worker/sync/SharedSyncImplementation.worker.js', import.meta.url));
    const { port } = worker;
    this.stateManager = Comlink.wrap<SharedSyncImplementation>(port);

    port.onmessage = (event: MessageEvent<SharedSyncMessage>) => {
      const {
        data: { type, payload }
      } = event;
      if (type !== SharedSyncMessageType.UPDATE || payload.tabId == this.syncTabId) {
        // Don't update from own updates
        return;
      }
      // Don't broadcast this to the shared implementation
      this.internalUpdateStatus(payload);
    };

    // Load the initial state
    this.stateManager.getState().then((state) => this.internalUpdateStatus(state));
  }

  /**
   * Obtains a global lock between tabs for syncing and CRUD
   * uploads
   */
  obtainLock<T>(lockOptions: LockOptions<T>): Promise<T> {
    return navigator.locks.request(lockOptions.type, async () => {
      try {
        await lockOptions.callback();
      } catch (ex) {
        console.error('caught exception in lock context', ex);
      }
    });
  }

  /**
   * Triggers update of sync status without broadcasting to shared sync
   * manager
   */
  protected internalUpdateStatus(state: SharedSyncStatus) {
    const { lastSyncedAt } = state;
    return super.updateSyncStatus(state.connected, lastSyncedAt ? new Date(lastSyncedAt) : undefined);
  }

  protected updateSyncStatus(connected: boolean, lastSyncedAt?: Date | undefined): void {
    super.updateSyncStatus(connected, lastSyncedAt);
    //Broadcast this update to shared sync manager
    this.stateManager.updateState({
      connected,
      lastSyncedAt: lastSyncedAt?.toISOString(),
      tabId: this.syncTabId
    });
  }
}
