import {
  AbstractPowerSyncDatabase,
  AbstractStreamingSyncImplementation,
  PowerSyncBackendConnector,
  SqliteBucketStorage,
  BucketStorageAdapter,
  PowerSyncDatabaseOptions,
  PowerSyncDBListener
} from '@journeyapps/powersync-sdk-common';
import { v4 as uuid } from 'uuid';

import { WebRemote } from './sync/WebRemote';
import { WebStreamingSyncImplementation } from './sync//WebStreamingSyncImplementation';

export type ListenerEvent = keyof PowerSyncDBListener;

export type ListenerPayload = {
  [event in ListenerEvent]: PowerSyncDBListener[event];
};

export type BroadcastEvent<T extends ListenerEvent = ListenerEvent> = {
  tabId: string;
  type: T;
  payload: ListenerPayload[T];
};

export class PowerSyncDatabase extends AbstractPowerSyncDatabase {
  static CHANNEL_NAME = 'PowerSync-Broadcast';

  tabId: string;
  channel: BroadcastChannel;

  constructor(options: PowerSyncDatabaseOptions) {
    super(options);
    this.tabId = uuid();
    this.channel = new BroadcastChannel(PowerSyncDatabase.CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent<BroadcastEvent>) => {
      const { data } = event;
      if (data.tabId == this.tabId) {
        // Don't repeat own broadcasted listener events
        return;
      }
      // Iterate the listeners locally
      this.iterateListeners((cb) => cb[data.type]?.(data.payload));
    };

    this.registerListener({
      statusChanged: (status) => {}
    });
  }

  async _initialize(): Promise<void> {}

  protected generateBucketStorageAdapter(): BucketStorageAdapter {
    return new SqliteBucketStorage(this.database, AbstractPowerSyncDatabase.transactionMutex);
  }

  protected generateSyncStreamImplementation(
    connector: PowerSyncBackendConnector
  ): AbstractStreamingSyncImplementation {
    const remote = new WebRemote(connector);

    return new WebStreamingSyncImplementation({
      adapter: this.bucketStorageAdapter,
      remote,
      uploadCrud: async () => {
        await this.waitForReady();
        await connector.uploadData(this);
      },
      retryDelayMs: this.options.retryDelay
    });
  }
}
