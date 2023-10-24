import {
  AbstractPowerSyncDatabase,
  AbstractStreamingSyncImplementation,
  PowerSyncBackendConnector,
  SqliteBucketStorage,
  BucketStorageAdapter
} from '@journeyapps/powersync-sdk-common';

import { WebRemote } from './sync/WebRemote';
import { WebStreamingSyncImplementation } from './sync//WebStreamingSyncImplementation';

export class PowerSyncDatabase extends AbstractPowerSyncDatabase {
  async _init(): Promise<void> {}

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
        await this.initialized;
        await connector.uploadData(this);
      },
      retryDelayMs: this.options.retryDelay
    });
  }
}
