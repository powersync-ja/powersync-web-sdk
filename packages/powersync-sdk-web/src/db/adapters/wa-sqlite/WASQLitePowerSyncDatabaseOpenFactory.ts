import {
  AbstractPowerSyncDatabase,
  AbstractPowerSyncDatabaseOpenFactory,
  DBAdapter,
  PowerSyncDatabaseOptions
} from '@journeyapps/powersync-sdk-common';
import { PowerSyncDatabase } from '../../../db/PowerSyncDatabase';
import { WASQLiteDBAdapter } from './WASQLiteDBAdapter';

export class WASQLitePowerSyncDatabaseOpenFactory extends AbstractPowerSyncDatabaseOpenFactory {
  protected openDB(): DBAdapter {
    return new WASQLiteDBAdapter(this.options);
  }

  generateInstance(options: PowerSyncDatabaseOptions): AbstractPowerSyncDatabase {
    return new PowerSyncDatabase(options);
  }
}
