import '@journeyapps/wa-sqlite';

import _ from 'lodash';
import * as Comlink from 'comlink';
import { DBWorkerInterface, InternalDBWorkerInterface, _openDB } from './open-db';

const _self: SharedWorkerGlobalScope = self as any;

const DBMap = new Map<string, InternalDBWorkerInterface>();

const openDB = async (dbFileName: string): Promise<DBWorkerInterface> => {
  if (!DBMap.has(dbFileName)) {
    DBMap.set(dbFileName, await _openDB(dbFileName));
  }
  return Comlink.proxy(DBMap.get(dbFileName)!);
};

_self.onconnect = function (event: MessageEvent<string>) {
  const port = event.ports[0];

  console.debug('Exposing db on port', port);
  Comlink.expose(openDB, port);
};

addEventListener('beforeunload', (event) => {
  Array.from(DBMap.values()).forEach((db) => {
    db.close?.();
  });
});
