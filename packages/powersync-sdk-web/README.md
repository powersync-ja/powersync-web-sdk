# PowerSync SDK for Web

[PowerSync](https://powersync.co) is a service and set of SDKs that keeps Postgres databases in sync with on-device SQLite databases. See a summary of features [here](https://docs.powersync.co/client-sdk-references/react-native-and-expo).

## Alpha Release
This SDK package is currently in an alpha release.

# Installation

## Install Package

```bash
npm install @journeyapps/powersync-sdk-web
```

## Install Peer Dependency: WA-SQLite

This SDK currently requires `@journeyapps/wa-sqlite` as a peer dependency.

Install it in your app with:

```bash 
npm install @journeyapps/wa-sqlite
```

## Logging
This package uses [js-logger](https://www.npmjs.com/package/js-logger) for logging. 

Enable JS Logger with your logging interface of choice or use the default `console`
```JavaScript
import Logger from 'js-logger';

// Log messages will be written to the window's console.
Logger.useDefaults();
```

Enable verbose output in the developer tools for detailed logs.

The WASQLite DB Adapter opens SQLite connections inside a shared webworker. This worker can be inspected in Chrome by accessing

```
chrome://inspect/#workers
```


# Getting Started

See our [Docs](https://docs.powersync.co/usage/installation/client-side-setup) for detailed instructions.

```JavaScript
import {
  Column,
  ColumnType,
  WASQLitePowerSyncDatabaseOpenFactory,
  Schema,
  Table
} from '@journeyapps/powersync-sdk-web';

export const AppSchema = new Schema([
  new Table({ name: 'customers', columns: [new Column({ name: 'name', type: ColumnType.TEXT })] })
]);

let PowerSync;

export const openDatabase = async () => {
  PowerSync = new WASQLitePowerSyncDatabaseOpenFactory({
    schema: AppSchema,
    dbFilename: 'test.sqlite'
  }).getInstance();

  await PowerSync.init();

  // Run local statements.
  await PowerSync.execute('INSERT INTO customers(id, name) VALUES(uuid(), ?)', ['Fred']);
};

class Connector {
  async fetchCredentials() {
    // TODO logic to fetch a session
    return {
      endpoint: '[The PowerSync instance URL]',
      token: 'An authentication token',
      expiresAt: 'When the token expires',
    };
  }

  async uploadData(database) {
    // Upload local changes to backend, see docs for example
  }
}

export const connectPowerSync = async () => {
  const connector = new Connector(); // Which was declared above
  await PowerSync.connect(connector);
};

```

React hooks are available in the [@journeyapps/powersync-react](https://www.npmjs.com/package/@journeyapps/powersync-react) package

Refer to our [full documentation](https://docs.powersync.co/client-sdk-references/react-native-and-expo) to learn more.