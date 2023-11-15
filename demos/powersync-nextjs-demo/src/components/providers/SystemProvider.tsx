'use client';
import _ from 'lodash';
import React from 'react';
import Logger from 'js-logger';
import { PowerSyncContext } from '@journeyapps/powersync-react';
import { WASQLitePowerSyncDatabaseOpenFactory } from '@journeyapps/powersync-sdk-web';
import { AppSchema } from '@/library/powersync/AppSchema';
import { SupabaseConnector } from '@/library/powersync/SupabaseConnector';
import { useRouter } from 'next/navigation';
import { DEFAULT_ENTRY_ROUTE } from '../Routes';

const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const [connector] = React.useState(new SupabaseConnector());
  const [powerSync] = React.useState(
    new WASQLitePowerSyncDatabaseOpenFactory({
      dbFilename: 'example.db',
      schema: AppSchema,
      // This is disabled once CSR+SSR functionality is verified to be working correctly
      disableSSRWarning: true
    }).getInstance()
  );

  const router = useRouter();

  React.useEffect(() => {
    // Linting thinks this is a hook due to it's name
    Logger.useDefaults(); // eslint-disable-line
    Logger.setLevel(Logger.DEBUG);

    //@ts-ignore For console testing purposes
    window._powersync = powerSync;
    powerSync.init();

    connector.registerListener({
      initialized: () => {
        if (connector.currentSession) {
          powerSync.connect(connector);
          router.push(DEFAULT_ENTRY_ROUTE);
        } else {
          router.push('/auth/login');
        }
      },
      sessionStarted: () => {
        powerSync.connect(connector);
      }
    });

    connector.init();
  }, [powerSync, connector, router]);

  return (
    <PowerSyncContext.Provider value={powerSync}>
      <SupabaseContext.Provider value={connector}>{children}</SupabaseContext.Provider>
    </PowerSyncContext.Provider>
  );
};

export default SystemProvider;
