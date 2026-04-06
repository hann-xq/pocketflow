import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Stores the entire serialized TanStack Query cache as a single JSON blob.
// The cache is restored on app startup so offline reads are served immediately.
export const queryCache = sqliteTable('query_cache', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
  timestamp: integer('timestamp').notNull(),
});

// Offline write queue. One row per pending mutation queued while the device
// was offline. Processed in FIFO order when connectivity is restored.
export const pendingOperations = sqliteTable('pending_operations', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull(),       // temp UUID or server UUID
  entityType: text('entity_type', { enum: ['transaction', 'bank_account', 'tag'] }).notNull(),
  operation: text('operation', { enum: ['create', 'update', 'update_tags', 'delete'] }).notNull(),
  payload: text('payload').notNull(),          // JSON string with API call arguments
  createdAt: text('created_at').notNull(),     // ISO 8601
});
