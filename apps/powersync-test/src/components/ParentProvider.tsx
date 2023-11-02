'use client';
import _ from 'lodash';
import React from 'react';
import Logger from 'js-logger';
import { PowerSyncContext } from '@journeyapps/powersync-react';
import { WASQLitePowerSyncDatabaseOpenFactory } from '@journeyapps/powersync-sdk-web';
import { AppSchema } from '@/library/powersync/AppSchema';
import { SupabaseConnector } from '@/library/powersync/SupabaseConnector';
import { useRouter } from 'next/navigation';

const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);

const PowerSync = new WASQLitePowerSyncDatabaseOpenFactory({
  dbFilename: 'example.db',
  schema: AppSchema
}).getInstance();

const connector = new SupabaseConnector();

export default function ParentProvider({ children }: { children: React.ReactNode }) {
  const initialized = React.useRef(false);
  const router = useRouter();

  React.useEffect(() => {
    /**
     * React Strict mode will execute these useEffect twice in dev mode. We only want this to execute once
     */
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    Logger.useDefaults();
    Logger.setLevel(Logger.DEBUG);

    console.log('Initializing PowerSync');
    PowerSync.init();

    connector.registerListener({
      initialized: () => {
        if (connector.currentSession) {
          PowerSync.connect(connector);
          router.push('/todo-lists');
        } else {
          router.push('/auth/login');
        }
      },
      sessionStarted: () => {
        PowerSync.connect(connector);
      }
    });

    connector.init();
  }, []);

  return (
    <PowerSyncContext.Provider value={PowerSync}>
      <SupabaseContext.Provider value={connector}>{children}</SupabaseContext.Provider>
    </PowerSyncContext.Provider>
  );
}
