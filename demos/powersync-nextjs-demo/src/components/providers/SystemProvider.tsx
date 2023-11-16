'use client';
import _ from 'lodash';
import React, { Suspense } from 'react';
import Logger from 'js-logger';
import { PowerSyncContext } from '@journeyapps/powersync-react';
import { WASQLitePowerSyncDatabaseOpenFactory } from '@journeyapps/powersync-sdk-web';
import { AppSchema } from '@/library/powersync/AppSchema';
import { SupabaseConnector } from '@/library/powersync/SupabaseConnector';
import { useRouter, usePathname } from 'next/navigation';
import { DEFAULT_ENTRY_ROUTE } from '../Routes';
import { CircularProgress } from '@mui/material';

const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);

/**
 * This provider acts as an authenticator guard. If there is no active
 * session it will navigate to the login screen. If there is an
 * active session and the current path is the index, it will navigate
 * to the default entry point page.
 */
const REDIRECT_ON_AUTHENTICATED_ROUTES = ['/'];

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

    const l = connector.registerListener({
      initialized: () => {
        if (!connector.currentSession) {
          router.push('/auth/login');
          return;
        }
      },
      sessionStarted: () => {
        powerSync.connect(connector);
      }
    });

    connector.init();

    return () => l?.();
  }, [powerSync, connector, router]);

  return (
    <Suspense fallback={<CircularProgress />}>
      <PowerSyncContext.Provider value={powerSync}>
        <SupabaseContext.Provider value={connector}>{children}</SupabaseContext.Provider>
      </PowerSyncContext.Provider>
    </Suspense>
  );
};

export default SystemProvider;
