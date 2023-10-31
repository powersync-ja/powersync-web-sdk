'use client';
import _ from 'lodash';
import React from 'react';
import Logger from 'js-logger';
import { PowerSyncContext } from '@journeyapps/powersync-react';
import { AbstractPowerSyncDatabase, WASQLitePowerSyncDatabaseOpenFactory } from '@journeyapps/powersync-sdk-web';
import { AppSchema } from '@/library/powersync/AppSchema';
import { SupabaseConnector } from '@/library/powersync/SupabaseConnector';

Logger.useDefaults();
Logger.setLevel(Logger.DEBUG);

export default function ParentProvider({ children }: { children: React.ReactNode }) {
  const ps = React.useRef<AbstractPowerSyncDatabase>();
  React.useEffect(() => {
    /**
     * NextJS uses React Strict mode by default. This causes useEffects to be executed
     * twice in dev mode. This init should only be executed once.
     * https://stackoverflow.com/questions/61254372/my-react-component-is-rendering-twice-because-of-strict-mode
     */
    if (ps.current) {
      return;
    }
    const factory = new WASQLitePowerSyncDatabaseOpenFactory({ dbFilename: 'example.db', schema: AppSchema });
    const PowerSync = factory.getInstance();

    ps.current = PowerSync;
    PowerSync.init().then(async () => {
      const connector = new SupabaseConnector();
      await connector.init();
      await PowerSync.connect(connector);
    });
  }, []);

  return <PowerSyncContext.Provider value={ps.current}>{children}</PowerSyncContext.Provider>;
}
