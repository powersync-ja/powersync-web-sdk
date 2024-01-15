
import * as Y from 'yjs';

import { b64ToUint8Array, Uint8ArrayTob64 } from '@/library/binary-utils';
import { v4 as uuidv4 } from 'uuid';
import { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';

/**
 * Configure bidirectional sync for a Yjs document with a PowerSync database.
 * 
 * @param ydoc 
 * @param db 
 * @param documentId 
 * @returns a dispose function to clear the listeners
 */
export function setupPowerSyncDoc(ydoc: Y.Doc, db: AbstractPowerSyncDatabase, documentId: string): () => void {
  let seenDocUpdates = new Set();
  const abortController = new AbortController();
  const updates = db.watch('SELECT * FROM document_updates WHERE document_id = ?', [documentId], { signal: abortController.signal });

  const processUpdates = async () => {
    for await (let results of updates) {
      if (abortController.signal.aborted) {
        break;
      }

      // New data detected in the database
      for (let update of results.rows!._array) {
        // Ignore any updates we've already seen
        if (!seenDocUpdates.has(update.id)) {
          seenDocUpdates.add(update.id);
          // apply the update from the database to the doc
          Y.applyUpdateV2(ydoc, b64ToUint8Array(update.update_b64), 'db');
        }
      }
    }
  }
  processUpdates();

  const updateListener = async (update: Uint8Array, origin: string) => {
    if (origin == 'db') {
      // update originated from the database / PowerSync - ignore
      return;
    }
    // update originated from elsewhere - save to the database
    const docUpdateId = uuidv4();
    seenDocUpdates.add(docUpdateId);
    await db.execute('INSERT INTO document_updates(id, document_id, update_b64) VALUES(?, ?, ?)', [docUpdateId, documentId, Uint8ArrayTob64(update)]);
  }
  ydoc.on('updateV2', updateListener);

  return () => {
    abortController.abort();
    ydoc.off('updateV2', updateListener);
  }
}