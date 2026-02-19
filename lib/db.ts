import { createClient } from '@libsql/client/web';
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
        return createClient({
            url: 'file:local.db',
        });
    }

    // Force HTTPS for web client (fetch-based) in Edge environment
    const finalUrl = url.replace('libsql://', 'https://');

    console.log(`[DB] URL: ${finalUrl.substring(0, 20)}...`);
    console.log(`[DB] Token: ${authToken ? 'present (' + authToken.length + ' chars)' : 'MISSING'}`);

    return createClient({
        url: finalUrl,
        authToken: authToken?.trim(),
        fetch: globalThis.fetch,
    });
};

export const getDb = () => {
    const client = getClient();
    return drizzle(client, { schema });
};
