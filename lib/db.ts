import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const getClient = () => {
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

    if (!url) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('TURSO_DATABASE_URL is not set. Check Cloudflare Dashboard.');
        }
        console.warn('TURSO_DATABASE_URL is not set, using "file:local.db"');
        // fallback for local dev if needed, though @libsql/client/web doesn't like file:
        return createClient({
            url: 'file:local.db',
        });
    }

    // Force HTTPS for web client (fetch-based) in Edge environment
    const finalUrl = url.replace('libsql://', 'https://');

    // Safety check: ensure no raw params leakage in logs
    const safeUrl = finalUrl.replace(/:[^:@]*@/, ':***@').split('?')[0];

    console.log(`[DB] Initializing client with URL: ${safeUrl}`);
    console.log(`[DB] Auth Token Present: ${!!authToken}, Length: ${authToken?.length || 0}`);

    return createClient({
        url: finalUrl,
        authToken: authToken?.trim(),
        fetch: fetch,
    });
};

export const getDb = () => {
    const client = getClient();
    return drizzle(client, { schema });
};
