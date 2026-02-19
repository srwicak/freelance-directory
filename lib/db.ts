// Minimal Turso HTTP client using raw fetch — no @libsql/client, no drizzle
// This ensures zero XMLHttpRequest dependencies for Cloudflare Workers

import { getRequestContext } from '@cloudflare/next-on-pages';

interface TursoResult {
    columns: string[];
    rows: any[][];
    affected_row_count: number;
    last_insert_rowid: string | null;
}

interface TursoResponse {
    results: Array<{
        type: 'ok' | 'error';
        response?: {
            type: string;
            result: TursoResult;
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
}

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

    const data: TursoResponse = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error('No results from Turso');
    }

    const first = data.results[0];
    if (first.type === 'error') {
        throw new Error(`Turso query error: ${first.error?.message || 'Unknown'}`);
    }

    const result = first.response!.result;

    // Convert row arrays to objects using column names
    return {
        columns: result.columns,
        rows: result.rows,
    };
}

// Helper: execute and return rows as objects (column_name: value)
export async function tursoQuery(sql: string, args: any[] = []): Promise<Record<string, any>[]> {
    const { columns, rows } = await tursoExecute(sql, args);

    return rows.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach((col, i) => {
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
