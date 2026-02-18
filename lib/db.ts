import { createClient } from '@libsql/client';
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

    return createClient({
        url: url || 'file:local.db',
        authToken,
    });
};

export const getDb = () => {
    const client = getClient();
    return drizzle(client, { schema });
};
