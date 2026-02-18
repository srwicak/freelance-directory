import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

const getClient = () => {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('TURSO_DATABASE_URL is not set');
        }
        console.warn('TURSO_DATABASE_URL is not set, using "file:local.db"');
    }

    if (url?.startsWith('libsql://') && !authToken) {
        throw new Error('TURSO_AUTH_TOKEN is not set (required for remote connection)');
    }

    try {
        return createClient({
            url: url || 'file:local.db',
            authToken,
        });
    } catch (e) {
        console.error('Failed to create LibSQL client:', e);
        throw new Error(`Database client creation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

export const getDb = () => {
    const client = getClient();
    return drizzle(client, { schema });
};
