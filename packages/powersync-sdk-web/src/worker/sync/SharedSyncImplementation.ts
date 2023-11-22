import { BaseListener, BaseObserver } from '@journeyapps/powersync-sdk-common';

export enum SharedSyncMessageType {
  UPDATE = 'sync-status-update'
}

export type SharedSyncStatus = {
  connected: boolean;
  lastSyncedAt?: string;
  //   The tab which posted the status update
  tabId?: string;
};

export type SharedSyncMessage = {
  type: SharedSyncMessageType;
  payload: SharedSyncStatus;
};

export interface SharedSyncImplementationListener extends BaseListener {
  statusChanged: (status: SharedSyncStatus) => void;
}

export class SharedSyncImplementation extends BaseObserver<SharedSyncImplementationListener> {
  protected status: SharedSyncStatus;

  constructor() {
    super();
    this.status = {
      connected: false
    };
  }

  /**
   * Provides a method to get the current state
   * This is needed for a new tab to initialize it's local state
   * before relying on the next broadcast update.
   */
  getState(): SharedSyncStatus {
    return this.status;
  }

  updateState(status: SharedSyncStatus) {
    this.status = status;
    this.iterateListeners((cb) => cb.statusChanged?.(status));
  }
}
