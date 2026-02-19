'use server';


import { getDb } from '@/lib/db';
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
        const db = getDb();

        // DEBUG: Test Raw Connection
        let connectionTest = 'Not tested';
        try {
            await db.run(sql`SELECT 1`);
            connectionTest = 'Success (SELECT 1 passed)';
        } catch (e) {
            connectionTest = `Failed: ${e instanceof Error ? e.message : String(e)}`;
        }

        const data = await db.select().from(users).orderBy(desc(users.createdAt));
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
        Error Cause: ${error?.cause ? (typeof error.cause === 'object' ? JSON.stringify(error.cause) : String(error.cause)) : 'N/A'}
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
