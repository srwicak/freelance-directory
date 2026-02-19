// Minimal Turso HTTP client using raw fetch — no @libsql/client, no drizzle
// This ensures zero XMLHttpRequest dependencies for Cloudflare Workers

import { getRequestContext } from '@cloudflare/next-on-pages';

function getConfig() {
    let url = process.env.TURSO_DATABASE_URL;
    let authToken = process.env.TURSO_AUTH_TOKEN;

    // Try to get from Cloudflare context
    try {
        const context = getRequestContext();
        if (context?.env) {
            url = (context.env as any).TURSO_DATABASE_URL || url;
            authToken = (context.env as any).TURSO_AUTH_TOKEN || authToken;
        }
    } catch (e) {
        // Not in Cloudflare context
    }

    if (!url) {
        throw new Error('TURSO_DATABASE_URL is not set.');
    }

    // Convert libsql:// to https:// for HTTP API
    const httpUrl = url.replace('libsql://', 'https://');

    return { url: httpUrl, authToken: authToken?.trim() || '' };
}

export async function tursoExecute(sql: string, args: any[] = []): Promise<{ columns: string[]; rows: any[][] }> {
    const { url, authToken } = getConfig();

    // Build Hrana-over-HTTP request
    const hranaArgs = args.map(arg => {
        if (arg === null || arg === undefined) {
            return { type: 'null' };
        } else if (typeof arg === 'number') {
            if (Number.isInteger(arg)) {
                return { type: 'integer', value: String(arg) };
            }
            return { type: 'float', value: arg };
        } else if (typeof arg === 'string') {
            return { type: 'text', value: arg };
        } else {
            return { type: 'text', value: String(arg) };
        }
    });

    const body = {
        requests: [
            { type: 'execute', stmt: { sql, args: hranaArgs } },
            { type: 'close' }
        ]
    };

    const response = await fetch(`${url}/v2/pipeline`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Turso HTTP error ${response.status}: ${text}`);
    }

    const data = await response.json() as any;

    if (!data.results || data.results.length === 0) {
        throw new Error(`No results from Turso. Response: ${JSON.stringify(data).substring(0, 500)}`);
    }

    const first = data.results[0];
    if (first.type === 'error') {
        throw new Error(`Turso query error: ${first.error?.message || JSON.stringify(first.error)}`);
    }

    const result = first.response?.result;
    if (!result) {
        throw new Error(`No result in response. Full response: ${JSON.stringify(data).substring(0, 500)}`);
    }

    // Hrana v2 uses "cols" (array of {name, decltype}) not "columns"
    const cols = result.cols || result.columns || [];
    const columnNames = cols.map((c: any) => typeof c === 'string' ? c : c.name);

    return {
        columns: columnNames,
        rows: result.rows || [],
    };
}

// Helper: execute and return rows as objects (column_name: value)
export async function tursoQuery(sql: string, args: any[] = []): Promise<Record<string, any>[]> {
    const { columns, rows } = await tursoExecute(sql, args);

    return rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, i: number) => {
            // Hrana returns values as { type, value } objects
            const cell = row[i];
            if (cell && typeof cell === 'object' && 'value' in cell) {
                obj[col] = cell.value;
            } else {
                obj[col] = cell;
            }
        });
        return obj;
    });
}
