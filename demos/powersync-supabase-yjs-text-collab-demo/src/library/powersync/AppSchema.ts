import { Column, ColumnType, Schema, Table } from '@journeyapps/powersync-sdk-web';

export const AppSchema = new Schema([
  new Table({
    name: 'documents',
    columns: [
      new Column({ name: 'title', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT })
    ]
  }),
  new Table({
    name: 'document_updates',
    columns: [
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'document_id', type: ColumnType.TEXT }),
      new Column({ name: 'update_b64', type: ColumnType.TEXT })
    ]
  })
]);
