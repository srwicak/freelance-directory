import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

const getClient = () => {
    let url = process.env.TURSO_DATABASE_URL;
    let authToken = process.env.TURSO_AUTH_TOKEN;

    // Try to get from Cloudflare context if not in process.env
    try {
        const context = getRequestContext();
        if (context?.env) {
            url = (context.env as any).TURSO_DATABASE_URL || url;
            authToken = (context.env as any).TURSO_AUTH_TOKEN || authToken;
        }
    } catch (e) {
        // Ignore error if getRequestContext fails
    }

    // DEBUG: Log connection details (masked)
    console.log('DB Connection Attempt:', {
        url_exists: !!url,
        url_prefix: url?.substring(0, 15),
        token_exists: !!authToken,
        token_length: authToken?.length,
        is_production: process.env.NODE_ENV === 'production'
    });

    if (!url) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('TURSO_DATABASE_URL is not set. Please check Cloudflare Dashboard -> Settings -> Variables and Secrets.');
        }
        console.warn('TURSO_DATABASE_URL is not set, using "file:local.db"');
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
