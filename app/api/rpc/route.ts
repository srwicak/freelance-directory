import * as serverActions from '@/lib/server-actions';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { action, args } = await req.json();

        const func = (serverActions as any)[action];
        if (typeof func === 'function') {
            const result = await func(...args);
            return Response.json(result);
        }

        return Response.json({ success: false, error: 'Unknown action' }, { status: 400 });
    } catch (e: any) {
        console.error('[RPC Error]', e);
        return Response.json({ success: false, error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
