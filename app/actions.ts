'use server';


import { getDb, getClient } from '@/lib/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function registerUser(formData: {
    name: string;
    field: string;
    province: string;
    city: string;
    details: string;
    portfolio: string;
    linkedin: string;
}) {
    try {
        const userId = nanoid(10);
        const db = getDb();

        await db.insert(users).values({
            id: userId,
            ...formData,
            createdAt: new Date(),
        });

        revalidatePath('/directory');
        return { success: true, userId };
    } catch (error) {
        console.error('Failed to register user:', error);
        return { success: false, error: 'Gagal mendaftar user.' };
    }
}

export async function getFreelancers() {
    try {
        const client = getClient();
        console.log('[DB] Diagnostic: Starting...');

        // 1. Test Raw Connection
        try {
            console.log('[DB] 1. Testing SELECT 1...');
            await client.execute('SELECT 1');
            console.log('[DB] 1. Success.');
        } catch (e: any) {
            console.error('[DB] 1. Failed:', e);
            throw new Error(`Connection Test Failed: ${e.message}`);
        }

        // 2. Check Tables
        try {
            console.log('[DB] 2. Checking Tables...');
            const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
            console.log('[DB] 2. Tables found:', tables.rows);

            const hasFreelancers = tables.rows.some(r => r.name === 'freelancers' || r[0] === 'freelancers');
            if (!hasFreelancers) {
                console.error('[DB] CRITICAL: Table "freelancers" NOT FOUND in remote DB!');
                return { success: false, error: 'Database integrity error: Table missing.' };
            }
        } catch (e: any) {
            console.error('[DB] 2. Failed to list tables:', e);
            // Don't throw, might be permission issue, try proceeding
        }

        // 3. Test Raw Select
        try {
            console.log('[DB] 3. Testing Raw Select on freelancers...');
            const count = await client.execute('SELECT count(*) FROM freelancers');
            console.log('[DB] 3. Count result:', count.rows);
        } catch (e: any) {
            console.error('[DB] 3. Failed raw select:', e);
            throw new Error(`Raw Query Failed: ${e.message}`);
        }

        // 4. Attempt Drizzle
        console.log('[DB] 4. Attempting Drizzle Query...');
        const db = getDb();
        const data = await db.select().from(users).limit(5);
        console.log('[DB] 4. Drizzle Success. Rows:', data.length);

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch freelancers:', error);

        const url = process.env.TURSO_DATABASE_URL;

        // Safe logging of URL
        const safeUrl = url ? url.replace(/:[^:@]*@/, ':***@') : 'N/A';

        const debugInfo = `
        [DEBUG INFO]
        Runtime: ${process.env.NEXT_RUNTIME || 'unknown'}
        URL: ${safeUrl}
        Step Failed: ${error.message}
        Stack: ${error.stack}
        `;

        return {
            success: false,
            error: `Diagnostics Failed: ${error.message}`
        };
    }
}

export async function getUserById(id: string) {
    try {
        const db = getDb();
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        const user = result[0];

        if (!user) {
            return { success: false, error: 'User tidak ditemukan.' };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return { success: false, error: 'Gagal mengambil data user.' };
    }
}

export async function updateUser(id: string, formData: {
    name?: string;
    field?: string;
    province?: string;
    city?: string;
    details?: string;
    portfolio?: string;
    linkedin?: string;
}) {
    try {
        const db = getDb();
        await db.update(users)
            .set({
                ...formData,
            })
            .where(eq(users.id, id));

        revalidatePath('/directory');
        revalidatePath(`/edit-profile`);

        return { success: true };
    } catch (error) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Gagal update user.' };
    }
}
