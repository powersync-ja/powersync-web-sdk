'use client';

import _ from 'lodash';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useSupabase } from '@/components/providers/SystemProvider';
import { usePowerSync, usePowerSyncWatchedQuery } from '@journeyapps/powersync-react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  TextField,
  Typography,
  styled
} from '@mui/material';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { b64ToUint8Array, Uint8ArrayTob64 } from '@/library/binary-utils';

import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from '@/components/widgets/MenuBar';
import './tiptap-styles.scss';

const ydoc = new Y.Doc();
let seenDocUpdates = new Set();

export default function EditorPage({ params }: { params: { document_id: string } }) {
  const powerSync = usePowerSync();
  const supabase = useSupabase();
  const router = useRouter();

  const [totalDocUpdates, setTotalDocUpdates] = useState(0);

  const tipTapEventListenerSet = useRef(false);

  // cache the last edited document ID in local storage
  const documentId = params.document_id;
  if (window.localStorage.getItem('lastDocumentId') != documentId) {
    window.localStorage.setItem('lastDocumentId', documentId);
  }

  // watch for total number of document updates changing to update the counter
  const docUpdatesCount = usePowerSyncWatchedQuery(
    'SELECT COUNT(*) as total_updates FROM document_updates WHERE document_id=?',
    [documentId]
  );
  useMemo(() => {
    if (docUpdatesCount.length > 0) setTotalDocUpdates(docUpdatesCount[0].total_updates);
  }, [docUpdatesCount]);

  // watch the database for updates to the document
  const docUpdatesQueryResult = usePowerSyncWatchedQuery('SELECT * FROM document_updates WHERE document_id = ?', [
    documentId
  ]);
  const applyDocumentUpdates = async function () {
    for (let update of docUpdatesQueryResult) {
      if (!seenDocUpdates.has(update.id)) {
        seenDocUpdates.add(update.id);
        // apply the update from the database to the doc
        Y.applyUpdateV2(ydoc, b64ToUint8Array(update.update_b64), 'db');
      }
    }
  };
  useEffect(() => {
    applyDocumentUpdates();
  }, [docUpdatesQueryResult]);

  // listen for updates to the document and automatically persist them
  useEffect(() => {
    if (!tipTapEventListenerSet.current) {
      ydoc.on('updateV2', async (update, origin) => {
        if (origin == 'db') {
          // update originated from the database / PowerSync - ignore
          return;
        }
        // update originated from elsewhere - save to the database
        const docUpdateId = uuidv4();
        seenDocUpdates.add(docUpdateId);
        await powerSync.execute('INSERT INTO document_updates(id, document_id, update_b64) VALUES(?, ?, ?)', [
          docUpdateId,
          documentId,
          Uint8ArrayTob64(update)
        ]);
      });
      tipTapEventListenerSet.current = true;
    }
  }, []);

  // tiptap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false
      }),
      Highlight,
      TaskList,
      TaskItem,
      Collaboration.configure({
        document: ydoc
      })
    ]
  });

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Box>
        <h2>PowerSync Yjs CRDT Document Collaboration Demo</h2>
        <p>
          Edit text below and it will sync in to other users who have this page URL open in their browser. Conflicts are
          automatically resolved using CRDTs. Powered by{' '}
          <a href="https://github.com/yjs/yjs" target="_blank">
            Yjs
          </a>{' '}
          and{' '}
          <a href="https://tiptap.dev/" target="_blank">
            Tiptap
          </a>
          .
        </p>
      </Box>
      <div className="editor">
        {editor && <MenuBar editor={editor} />}
        <EditorContent className="editor__content" editor={editor} />
      </div>
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" display="block" gutterBottom>
          {totalDocUpdates} total edit(s) in this document.
        </Typography>
      </Box>
    </Container>
  );
}
