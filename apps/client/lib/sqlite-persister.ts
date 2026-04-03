import type { Persister } from '@tanstack/react-query-persist-client';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { queryCache } from '@/db/schema';

const CACHE_KEY = 'tq_cache';

export const sqlitePersister: Persister = {
  async persistClient(client) {
    const data = JSON.stringify(client);

    await db
      .insert(queryCache)
      .values({ key: CACHE_KEY, data, timestamp: Date.now() })
      .onConflictDoUpdate({
        target: queryCache.key,
        set: { data, timestamp: Date.now() },
      });
  },

  async restoreClient() {
    const rows = await db.select().from(queryCache).where(eq(queryCache.key, CACHE_KEY));
    return rows.length !== 0 ? JSON.parse(rows[0].data) : undefined;
  },

  async removeClient() {
    await db.delete(queryCache).where(eq(queryCache.key, CACHE_KEY));
  },
};
