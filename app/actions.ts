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
        console.log('[DB] Testing raw client connection...');

        // Raw connection test
        try {
            const rawTest = await client.execute("SELECT 1");
            console.log('[DB] Raw client execute success:', rawTest);
        } catch (rawError) {
            console.error('[DB] Raw client execute FAILED:', rawError);
            throw new Error(`Raw Client Connection Failed: ${rawError instanceof Error ? rawError.message : String(rawError)}`);
        }

        const db = getDb();
        console.log('[DB] Drizzle client initialized.');

        // Check tables via raw SQL via Drizzle
        // const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
        // console.log('[DB] Tables found:', tables.rows.map((r: any) => r.name));

        const data = await db.select().from(users).limit(5); // Simplify query temporarily
        console.log('[DB] Data fetched successfully:', data.length, 'records');

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch freelancers:', error);

        const url = process.env.TURSO_DATABASE_URL;

        const debugInfo = `
        [DEBUG INFO]
        Runtime: ${process.env.NEXT_RUNTIME || 'unknown'}
        URL Configured: ${!!url}
        URL Prefix: ${url ? url.substring(0, 10) + '...' : 'N/A'}
        Error Message: ${error?.message || String(error)}
        Error Stack: ${error?.stack || 'N/A'}
        `;

        return {
            success: false,
            error: `Gagal DB. ${debugInfo}`
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
